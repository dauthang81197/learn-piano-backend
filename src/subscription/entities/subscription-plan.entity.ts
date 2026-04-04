import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Display name, e.g. "Premium Monthly" */
  @Column()
  name: string;

  /** URL-friendly unique key, e.g. "free", "premium_monthly" */
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'usd' })
  currency: string;

  /** null means the plan has no recurring billing (free / lifetime) */
  @Column({ type: 'enum', enum: BillingCycle, nullable: true })
  billingCycle: BillingCycle | null;

  /** Number of free trial days; 0 = no trial */
  @Column({ default: 0 })
  trialDays: number;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  /** Stripe Price ID for this plan */
  @Column({ nullable: true, type: 'varchar' })
  stripePriceId: string | null;

  @OneToMany(() => UserSubscription, (sub) => sub.plan)
  subscriptions: UserSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
