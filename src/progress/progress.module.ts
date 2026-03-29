import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LessonsModule],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
