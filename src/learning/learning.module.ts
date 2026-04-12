import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { Course } from '../courses/course.entity';
import { Lesson } from '../lessons/lesson.entity';
import { User } from '../users/user.entity';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEnrollment, LessonProgress, Course, Lesson, User]),
    ProgressModule,
  ],
  providers: [LearningService],
  controllers: [LearningController],
  exports: [LearningService],
})
export class LearningModule {}
