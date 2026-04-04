import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { UserSubscription } from './user-subscription.entity';

export enum SubscriptionEventType {
  CREATED = 'created',
  ACTIVATED = 'activated',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  CHANGED_PLAN = 'changed_plan',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  PAUSED = 'paused',
  RESUMED = 'resumed',
}

@Entity('subscription_events')
export class SubscriptionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.subscriptionEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => UserSubscription, (sub) => sub.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: UserSubscription;

  @Column({ type: 'enum', enum: SubscriptionEventType })
  eventType: SubscriptionEventType;

  /** Additional context: old plan, new plan, invoice id, etc. */
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
