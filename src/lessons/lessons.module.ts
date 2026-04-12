import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { LessonContent } from './lesson-content.entity';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { AdminLessonsController } from './admin-lessons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, LessonContent])],
  providers: [LessonsService],
  controllers: [LessonsController, AdminLessonsController],
  exports: [LessonsService],
})
export class LessonsModule {}
