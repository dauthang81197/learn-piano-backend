import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { SubscriptionEvent } from './entities/subscription-event.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SubscriptionPlan,
      UserSubscription,
      SubscriptionInvoice,
      PaymentMethod,
      SubscriptionEvent,
    ]),
  ],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
