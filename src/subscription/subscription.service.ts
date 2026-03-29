import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionType } from '../users/user.entity';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    features: ['Access to free lessons', 'Basic quiz', 'Track progress'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'usd',
    features: [
      'All free features',
      'Unlimited premium lessons',
      'Advanced quizzes',
      'Priority support',
      'Download lessons',
    ],
  },
];

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {
    this.stripe = new Stripe(
      this.config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2026-03-25.dahlia' },
    );
  }

  getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  async upgradeSubscription(
    user: User,
    dto: UpgradeSubscriptionDto,
  ): Promise<{ message: string; subscription: string }> {
    try {
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.name,
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(dto.paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: dto.paymentMethodId },
      });

      // Create subscription
      const priceId = this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      user.stripeSubscriptionId = stripeSubscription.id;
      user.subscription = SubscriptionType.PREMIUM;
      await this.usersRepo.save(user);

      return {
        message: 'Subscription upgraded to premium successfully',
        subscription: SubscriptionType.PREMIUM,
      };
    } catch (err) {
      this.logger.error('Stripe error:', err.message);
      throw new BadRequestException(`Payment failed: ${err.message}`);
    }
  }

  async cancelSubscription(
    user: User,
  ): Promise<{ message: string }> {
    if (!user.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }
    try {
      await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      user.subscription = SubscriptionType.FREE;
      user.stripeSubscriptionId = null;
      await this.usersRepo.save(user);
      return { message: 'Subscription cancelled successfully' };
    } catch (err) {
      throw new BadRequestException(`Cancellation failed: ${err.message}`);
    }
  }
}
