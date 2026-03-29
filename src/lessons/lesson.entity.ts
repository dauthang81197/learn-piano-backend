import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'text' })
  content: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

