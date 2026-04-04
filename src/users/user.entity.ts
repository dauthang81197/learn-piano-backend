import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { PaymentMethod } from '../subscription/entities/payment-method.entity';
import { SubscriptionInvoice } from '../subscription/entities/subscription-invoice.entity';
import { SubscriptionEvent } from '../subscription/entities/subscription-event.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionType {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.FREE,
  })
  subscription: SubscriptionType;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ type: 'simple-array', default: '' })
  badges: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastActiveDate: Date;

  @Column({ type: 'simple-array', default: '' })
  completedLessons: string[];

  /** Stripe Customer ID — stays at user level (one customer per user) */
  @Column({ nullable: true, type: 'varchar' })
  stripeCustomerId: string | null;

  // ── Relationships ────────────────────────────────────────────────────────

  /** All subscriptions belonging to this user (active + history) */
  @OneToMany(() => UserSubscription, (sub) => sub.user)
  subscriptions: UserSubscription[];

  /** Saved payment methods */
  @OneToMany(() => PaymentMethod, (pm) => pm.user)
  paymentMethods: PaymentMethod[];

  /** All billing invoices */
  @OneToMany(() => SubscriptionInvoice, (inv) => inv.user)
  invoices: SubscriptionInvoice[];

  /** Audit log of subscription lifecycle events */
  @OneToMany(() => SubscriptionEvent, (ev) => ev.user)
  subscriptionEvents: SubscriptionEvent[];

  /**
   * Populated at runtime by JwtStrategy on every authenticated request.
   * NOT a DB column — TypeORM ignores fields without a column decorator.
   */
  activeSubscription?: UserSubscription | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
