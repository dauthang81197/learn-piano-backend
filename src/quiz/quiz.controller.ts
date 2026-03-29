import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
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

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo câu hỏi quiz mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo câu hỏi thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  create(@Body() dto: CreateQuizDto) {
    return this.quizService.create(dto);
  }
}
