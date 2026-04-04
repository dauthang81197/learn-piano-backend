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
import { UserSubscription } from './user-subscription.entity';

export enum PaymentMethodType {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.paymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
    default: PaymentMethodType.CARD,
  })
  type: PaymentMethodType;

  /** Stripe PaymentMethod ID */
  @Column({ nullable: true, type: 'varchar' })
  stripePaymentMethodId: string | null;

  /** Last 4 digits (card) */
  @Column({ nullable: true, type: 'varchar' })
  last4: string | null;

  /** Card brand: visa, mastercard, etc. */
  @Column({ nullable: true, type: 'varchar' })
  brand: string | null;

  @Column({ nullable: true, type: 'int' })
  expMonth: number | null;

  @Column({ nullable: true, type: 'int' })
  expYear: number | null;

  @Column({ default: false })
  isDefault: boolean;

  @OneToMany(() => UserSubscription, (sub) => sub.paymentMethod)
  subscriptions: UserSubscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
