import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from '../users/user.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ProgressService } from '../progress/progress.service';

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  correctAnswers: { questionId: string; correct: boolean }[];
}

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    private progressService: ProgressService,
  ) {}

  async findByLesson(lessonId: string): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({ where: { lessonId } });
    if (!quiz) throw new NotFoundException('Quiz not found for this lesson');
    // Hide answers before sending to client
    const sanitized = {
      ...quiz,
      questions: quiz.questions.map(({ answer: _a, ...q }) => q),
    };
    return sanitized as Quiz;
  }

  async create(dto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepo.create(dto);
    return this.quizRepo.save(quiz);
  }

  async submitQuiz(
    lessonId: string,
    dto: SubmitQuizDto,
    user: User,
  ): Promise<QuizResult> {
    const quiz = await this.quizRepo.findOne({ where: { lessonId } });
    if (!quiz) throw new NotFoundException('Quiz not found for this lesson');

    let correct = 0;
    const correctAnswers = quiz.questions.map((q) => {
      const submitted = dto.answers.find((a) => a.questionId === q.id);
      const isCorrect = this.checkAnswer(
        q.answer,
        submitted?.answer,
      );
      if (isCorrect) correct++;
      return { questionId: q.id, correct: isCorrect };
    });

    const total = quiz.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Award XP only if score >= 60%
    let xpEarned = 0;
    if (percentage >= 60) {
      xpEarned = Math.round(quiz.xpReward * (percentage / 100));
      await this.progressService.addXp(user, xpEarned, lessonId);
    }

    return { score: correct, total, percentage, xpEarned, correctAnswers };
  }

  private checkAnswer(
    correct: string | string[],
    submitted: string | string[] | undefined,
  ): boolean {
    if (!submitted) return false;
    if (Array.isArray(correct) && Array.isArray(submitted)) {
      return (
        correct.length === submitted.length &&
        correct.every((c, i) => c.toLowerCase() === submitted[i]?.toLowerCase())
      );
    }
    return (
      String(correct).toLowerCase().trim() ===
      String(submitted).toLowerCase().trim()
    );
  }
}

