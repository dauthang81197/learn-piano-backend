import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('quiz')
@ApiBearerAuth('access-token')
@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Get(':lessonId')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi theo bài học' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách câu hỏi quiz' })
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.quizService.findByLesson(lessonId);
  }

  @Post(':lessonId/submit')
  @ApiOperation({ summary: 'Nộp bài quiz' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 201, description: 'Nộp bài thành công, trả về kết quả' })
  submitQuiz(
    @Param('lessonId') lessonId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: User,
  ) {
    return this.quizService.submitQuiz(lessonId, dto, user);
  }
}
