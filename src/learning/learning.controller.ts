import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('learning')
@ApiBearerAuth('access-token')
@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private learningService: LearningService) {}

  /**
   * POST /learning/courses/:courseId/start
   * Tạo enrollment nếu chưa có — gọi khi user nhấn "Bắt đầu học"
   */
  @Post('courses/:courseId/start')
  @ApiOperation({ summary: 'Bắt đầu học một khóa học (tạo enrollment nếu chưa có)' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiResponse({ status: 201, description: 'Enrollment được tạo hoặc đã tồn tại' })
  startCourse(@Param('courseId') courseId: string, @CurrentUser() user: User) {
    return this.learningService.startCourse(user, courseId);
  }

  /**
   * GET /learning/courses/:courseId/lessons
   * Danh sách bài học kèm tiến độ của user (isCompleted, status, completedAt)
   */
  @Get('courses/:courseId/lessons')
  @ApiOperation({ summary: 'Lấy danh sách bài học kèm tiến độ của user' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Danh sách bài học với trạng thái học' })
  getCourseLessons(@Param('courseId') courseId: string, @CurrentUser() user: User) {
    return this.learningService.getCourseLessons(user, courseId);
  }

  /**
   * POST /learning/courses/:courseId/lessons/:lessonId/start
   * Đánh dấu bài học đang học (in_progress) — gọi khi user mở bài học
   */
  @Post('courses/:courseId/lessons/:lessonId/start')
  @ApiOperation({ summary: 'Bắt đầu học một bài học cụ thể' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 201, description: 'Trạng thái bài học được cập nhật thành in_progress' })
  startLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.learningService.startLesson(user, courseId, lessonId);
  }

  /**
   * POST /learning/courses/:courseId/lessons/:lessonId/complete
   * Hoàn thành bài học + cộng XP — idempotent, an toàn gọi nhiều lần
   */
  @Post('courses/:courseId/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Hoàn thành bài học và nhận XP' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 201, description: 'Bài học hoàn thành, XP được cộng một lần duy nhất' })
  completeLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.learningService.completeLesson(user, courseId, lessonId);
  }

  /**
   * GET /learning/courses/:courseId/next-lesson
   * Bài học tiếp theo chưa hoàn thành (theo order)
   */
  @Get('courses/:courseId/next-lesson')
  @ApiOperation({ summary: 'Lấy bài học tiếp theo cần học' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Bài học tiếp theo chưa hoàn thành' })
  getNextLesson(@Param('courseId') courseId: string, @CurrentUser() user: User) {
    return this.learningService.getNextLesson(user, courseId);
  }
}
