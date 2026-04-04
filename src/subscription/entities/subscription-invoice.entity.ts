import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { UserSubscription } from './user-subscription.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  VOID = 'void',
}

export enum InvoiceType {
  /** First charge when subscribing */
  INITIAL = 'initial',
  /** Regular recurring charge */
  RENEWAL = 'renewal',
  /** Prorated charge/credit when changing plans */
  PRORATE = 'prorate',
  /** Refund issued to user */
  REFUND = 'refund',
}

@Entity('subscription_invoices')
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => UserSubscription, (sub) => sub.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: UserSubscription;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'enum', enum: InvoiceType, default: InvoiceType.RENEWAL })
  type: InvoiceType;

  /** Stripe Invoice ID */
  @Column({ nullable: true, type: 'varchar' })
  stripeInvoiceId: string | null;

  /** Stripe PaymentIntent ID */
  @Column({ nullable: true, type: 'varchar' })
  stripePaymentIntentId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Extra data: retry count, gateway response, etc. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
