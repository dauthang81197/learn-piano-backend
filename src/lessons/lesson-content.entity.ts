import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';

export enum ContentBlockType {
  TEXT = 'text',
  VIDEO = 'video',
  IMAGE = 'image',
}

@Entity('lesson_contents')
export class LessonContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'enum', enum: ContentBlockType })
  type: ContentBlockType;

  @Column({ default: 0 })
  order: number;

  // TEXT block
  @Column({ type: 'text', nullable: true })
  textData: string | null;

  // VIDEO hoặc IMAGE
  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  // VIDEO — thời lượng tính bằng giây
  @Column({ type: 'int', nullable: true })
  duration: number | null;

  // IMAGE
  @Column({ type: 'varchar', nullable: true })
  caption: string | null;

  @Column({ type: 'varchar', nullable: true })
  altText: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
