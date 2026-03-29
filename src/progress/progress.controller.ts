import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { LessonsService } from '../lessons/lessons.service';

@ApiTags('progress')
@ApiBearerAuth('access-token')
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private progressService: ProgressService,
    private lessonsService: LessonsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tiến độ học của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin tiến độ học' })
  getProgress(@CurrentUser() user: User) {
    return this.progressService.getProgress(user);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Lấy bảng xếp hạng' })
  @ApiResponse({ status: 200, description: 'Trả về bảng xếp hạng người dùng' })
  getLeaderboard() {
    return this.progressService.getLeaderboard();
  }

  /** Mark a theory lesson as complete and award XP */
  @Post('lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Đánh dấu bài học đã hoàn thành và nhận XP' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 201, description: 'Hoàn thành bài học thành công' })
  async completeLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    const lesson = await this.lessonsService.findOne(lessonId, user);
    const updated = await this.progressService.completeLesson(
      user,
      lessonId,
      lesson.xpReward,
    );
    return this.progressService.getProgress(updated);
  }
}

