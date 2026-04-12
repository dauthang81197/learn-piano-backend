import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tên file gốc khi upload */
  @Column()
  originalName: string;

  /** Tên file được lưu trong R2 (uuid + ext) */
  @Column()
  filename: string;

  /** Object key trong R2 bucket (vd: images/abc.jpg) */
  @Column()
  key: string;

  /** URL công khai để truy cập file */
  @Column()
  url: string;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  /** MIME type (vd: image/jpeg, video/mp4) */
  @Column()
  mimeType: string;

  /** Kích thước file tính bằng bytes */
  @Column({ type: 'bigint' })
  size: number;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
