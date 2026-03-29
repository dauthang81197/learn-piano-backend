import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  FILL_BLANK = 'fill-blank',
  MATCH = 'match',
}

export class QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string | string[];
}

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lessonId: string;

  @Column({ type: 'jsonb' })
  questions: QuizQuestion[];

  @Column({ default: 20 })
  xpReward: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
