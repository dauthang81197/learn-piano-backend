import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { PaymentMethod } from './payment-method.entity';
import { SubscriptionInvoice } from './subscription-invoice.entity';
import { SubscriptionEvent } from './subscription-event.entity';

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  planId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  /** When the subscription started */
  @Column({ type: 'timestamp' })
  startDate: Date;

  /**
   * Hard end date. Null means open-ended (auto-renews).
   * Set to next_billing_date when cancel_at_period_end triggers.
   */
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  /** When the free trial ends; null if no trial */
  @Column({ type: 'timestamp', nullable: true })
  trialEndDate: Date | null;

  /** Date of the next charge */
  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date | null;

  /**
   * Do not renew; set status = canceled when current period ends
   * (endDate == nextBillingDate)
   */
  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  /** Stripe Subscription ID */
  @Column({ nullable: true, type: 'varchar' })
  stripeSubscriptionId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  paymentMethodId: string | null;

  @ManyToOne(() => PaymentMethod, (pm) => pm.subscriptions, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod | null;

  @OneToMany(() => SubscriptionInvoice, (inv) => inv.subscription)
  invoices: SubscriptionInvoice[];

  @OneToMany(() => SubscriptionEvent, (ev) => ev.subscription)
  events: SubscriptionEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
