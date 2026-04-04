import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionType } from '../users/user.entity';
import { SubscriptionPlan, BillingCycle } from './entities/subscription-plan.entity';
import { UserSubscription, SubscriptionStatus } from './entities/user-subscription.entity';
import {
  SubscriptionInvoice,
  InvoiceStatus,
  InvoiceType,
} from './entities/subscription-invoice.entity';
import { PaymentMethod, PaymentMethodType } from './entities/payment-method.entity';
import { SubscriptionEvent, SubscriptionEventType } from './entities/subscription-event.entity';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { SelectPlanDto } from './dto/select-plan.dto';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private plansRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subscriptionsRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionInvoice)
    private invoicesRepo: Repository<SubscriptionInvoice>,
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepo: Repository<PaymentMethod>,
    @InjectRepository(SubscriptionEvent)
    private eventsRepo: Repository<SubscriptionEvent>,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'), {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  // ── Plans ──────────────────────────────────────────────────────────────────

  getPlans() {
    return this.plansRepo.find({ where: { isActive: true } });
  }

  // ── Upgrade / Subscribe ────────────────────────────────────────────────────

  async upgradeSubscription(
    user: User,
    dto: UpgradeSubscriptionDto,
  ): Promise<{ message: string; subscriptionId: string }> {
    try {
      // 1. Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.name,
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await this.usersRepo.save(user);
      }

      // 2. Attach & set default payment method
      await this.stripe.paymentMethods.attach(dto.paymentMethodId, {
        customer: customerId,
      });
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: dto.paymentMethodId },
      });

      // 3. Save PaymentMethod record
      const pmDetails = await this.stripe.paymentMethods.retrieve(dto.paymentMethodId);
      let paymentMethod = await this.paymentMethodsRepo.findOne({
        where: {
          userId: user.id,
          stripePaymentMethodId: dto.paymentMethodId,
        },
      });
      if (!paymentMethod) {
        paymentMethod = this.paymentMethodsRepo.create({
          userId: user.id,
          type: PaymentMethodType.CARD,
          stripePaymentMethodId: dto.paymentMethodId,
          last4: pmDetails.card?.last4 ?? null,
          brand: pmDetails.card?.brand ?? null,
          expMonth: pmDetails.card?.exp_month ?? null,
          expYear: pmDetails.card?.exp_year ?? null,
          isDefault: true,
        });
        await this.paymentMethodsRepo.save(paymentMethod);
      }

      // 4. Find the premium monthly plan
      const plan = await this.plansRepo.findOne({
        where: { slug: 'premium_monthly', isActive: true },
      });
      if (!plan) {
        throw new BadRequestException('Premium plan not found');
      }

      // 5. Create Stripe subscription
      const priceId = this.config.get<string>('STRIPE_PREMIUM_PRICE_ID');
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // 6. Calculate dates
      const now = new Date();
      const trialDays = plan.trialDays ?? 0;
      const trialEndDate = trialDays > 0 ? new Date(now.getTime() + trialDays * 86_400_000) : null;
      const nextBillingDate =
        plan.billingCycle === BillingCycle.YEARLY
          ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
          : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const initialStatus = trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE;

      // 7. Save UserSubscription
      const subscription = this.subscriptionsRepo.create({
        userId: user.id,
        planId: plan.id,
        status: initialStatus,
        startDate: now,
        trialEndDate,
        nextBillingDate,
        stripeSubscriptionId: stripeSubscription.id,
        paymentMethodId: paymentMethod.id,
      });
      await this.subscriptionsRepo.save(subscription);

      // 8. Create initial invoice record
      const invoice = this.invoicesRepo.create({
        userId: user.id,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        status: InvoiceStatus.PENDING,
        type: InvoiceType.INITIAL,
        dueDate: now,
      });
      await this.invoicesRepo.save(invoice);

      // 9. Log event
      await this.logEvent(user.id, subscription.id, SubscriptionEventType.CREATED, {
        planSlug: plan.slug,
        trialDays,
      });

      // 10. Update user.subscription cache
      user.subscription = SubscriptionType.PREMIUM;
      await this.usersRepo.save(user);

      return {
        message: 'Subscription upgraded to premium successfully',
        subscriptionId: subscription.id,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Stripe error:', message);
      throw new BadRequestException(`Payment failed: ${message}`);
    }
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  async cancelSubscription(user: User): Promise<{ message: string }> {
    const subscription = await this.subscriptionsRepo.findOne({
      where: {
        userId: user.id,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      // Cancel at period end in Stripe
      if (subscription.stripeSubscriptionId) {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Mark cancel_at_period_end; will set expired when cron runs
      subscription.cancelAtPeriodEnd = true;
      subscription.endDate = subscription.nextBillingDate;
      await this.subscriptionsRepo.save(subscription);

      await this.logEvent(user.id, subscription.id, SubscriptionEventType.CANCELED, {
        cancelAtPeriodEnd: true,
      });

      return {
        message: 'Subscription will be cancelled at the end of the current billing period',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Cancellation failed: ${message}`);
    }
  }

  // ── Change plan ────────────────────────────────────────────────────────────

  async changePlan(user: User, newPlanSlug: string): Promise<{ message: string }> {
    const [subscription, newPlan] = await Promise.all([
      this.subscriptionsRepo.findOne({
        where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      }),
      this.plansRepo.findOne({ where: { slug: newPlanSlug, isActive: true } }),
    ]);

    if (!subscription) throw new NotFoundException('No active subscription');
    if (!newPlan) throw new NotFoundException(`Plan ${newPlanSlug} not found`);

    const oldPlanSlug = subscription.plan?.slug ?? 'unknown';

    // Create prorate invoice (price difference)
    const prorate = Number(newPlan.price) - Number(subscription.plan?.price ?? 0);
    if (prorate !== 0) {
      const prorateInvoice = this.invoicesRepo.create({
        userId: user.id,
        subscriptionId: subscription.id,
        amount: Math.abs(prorate),
        currency: newPlan.currency,
        status: InvoiceStatus.PENDING,
        type: InvoiceType.PRORATE,
        dueDate: new Date(),
        description: `Plan change from ${oldPlanSlug} to ${newPlan.slug}`,
        metadata: { oldPlanSlug, newPlanSlug: newPlan.slug, prorate },
      });
      await this.invoicesRepo.save(prorateInvoice);
    }

    subscription.planId = newPlan.id;
    await this.subscriptionsRepo.save(subscription);

    await this.logEvent(user.id, subscription.id, SubscriptionEventType.CHANGED_PLAN, {
      from: oldPlanSlug,
      to: newPlan.slug,
    });

    return { message: `Plan changed to ${newPlan.name}` };
  }

  // ── Select Plan (first-time) ──────────────────────────────────────────────

  async selectPlan(
    user: User,
    dto: SelectPlanDto,
  ): Promise<{
    message: string;
    status: string;
    trialEndDate: Date;
    trialDaysLeft: number;
  }> {
    // Kiểm tra user đã có subscription chưa
    const existing = await this.subscriptionsRepo.findOne({
      where: [
        { userId: user.id, status: SubscriptionStatus.ACTIVE },
        { userId: user.id, status: SubscriptionStatus.TRIALING },
        { userId: user.id, status: SubscriptionStatus.PAST_DUE },
      ],
    });
    if (existing) {
      throw new BadRequestException('Bạn đã có subscription đang hoạt động.');
    }

    // Premium plan → yêu cầu thanh toán
    if (dto.planSlug !== 'free') {
      throw new BadRequestException(
        'Gói premium yêu cầu thanh toán. Vui lòng dùng POST /subscription/upgrade.',
      );
    }

    const plan = await this.plansRepo.findOne({
      where: { slug: 'free', isActive: true },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói free.');

    const now = new Date();
    // Lấy trialDays từ DB (đã set = 7), fallback về 7 nếu DB = 0
    const trialDays = plan.trialDays > 0 ? plan.trialDays : 7;
    const trialEndDate = new Date(now.getTime() + trialDays * 86_400_000);

    const subscription = this.subscriptionsRepo.create({
      userId: user.id,
      planId: plan.id,
      status: SubscriptionStatus.TRIALING,
      startDate: now,
      trialEndDate,
      nextBillingDate: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      paymentMethodId: null,
    });
    await this.subscriptionsRepo.save(subscription);

    await this.logEvent(user.id, subscription.id, SubscriptionEventType.TRIAL_STARTED, {
      planSlug: plan.slug,
      trialDays,
      trialEndDate: trialEndDate.toISOString(),
    });

    const trialDaysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / 86_400_000);

    return {
      message: `Dùng thử miễn phí ${trialDays} ngày đã được kích hoạt!`,
      status: SubscriptionStatus.TRIALING,
      trialEndDate,
      trialDaysLeft,
    };
  }

  // ── Get My Subscription ────────────────────────────────────────────────────

  async getMySubscription(userId: string) {
    const sub = await this.subscriptionsRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });

    if (!sub) {
      return {
        hasSubscription: false,
        needsPlanSelection: true,
        message: 'Vui lòng chọn gói subscription để bắt đầu.',
      };
    }

    const now = new Date();

    // Auto-expire: trial đã hết nhưng DB vẫn còn 'trialing'
    if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndDate && sub.trialEndDate < now) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionsRepo.save(sub);

      await this.logEvent(sub.userId, sub.id, SubscriptionEventType.TRIAL_ENDED, {
        expiredAt: now.toISOString(),
      });

      return {
        hasSubscription: true,
        needsPlanSelection: false,
        status: SubscriptionStatus.EXPIRED,
        planName: sub.plan.name,
        planSlug: sub.plan.slug,
        trialDaysLeft: 0,
        trialEndDate: sub.trialEndDate,
        message:
          'Thời gian dùng thử 7 ngày đã kết thúc. Vui lòng nâng cấp lên Premium để tiếp tục.',
      };
    }

    const trialDaysLeft = sub.trialEndDate
      ? Math.max(0, Math.ceil((sub.trialEndDate.getTime() - now.getTime()) / 86_400_000))
      : null;

    return {
      hasSubscription: true,
      needsPlanSelection: false,
      status: sub.status,
      planName: sub.plan.name,
      planSlug: sub.plan.slug,
      trialEndDate: sub.trialEndDate ?? null,
      trialDaysLeft,
      nextBillingDate: sub.nextBillingDate ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      startDate: sub.startDate,
    };
  }

  // ── Helper ─────────────────────────────────────────────────────────────────

  private async logEvent(
    userId: string,
    subscriptionId: string,
    eventType: SubscriptionEventType,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const event = this.eventsRepo.create({
      userId,
      subscriptionId,
      eventType,
      payload: payload ?? null,
    });
    await this.eventsRepo.save(event);
  }
}
