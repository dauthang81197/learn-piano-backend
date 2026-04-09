import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LessonContent } from './lesson-content.entity';

export enum LessonType {
  THEORY = 'theory',
  QUIZ = 'quiz',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany(() => LessonContent, (content) => content.lesson, { cascade: true })
  contents: LessonContent[];

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.THEORY })
  type: LessonType;

  @Column({ type: 'simple-array', default: '' })
  quizIds: string[];

  @Column({ default: 10 })
  xpReward: number;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ nullable: true, type: 'varchar' })
  courseId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
