import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';

@ApiTags('admin/quiz')
@ApiBearerAuth('access-token')
@Controller('admin/quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminQuizController {
  constructor(private quizService: QuizService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo câu hỏi quiz mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo câu hỏi thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  create(@Body() dto: CreateQuizDto) {
    return this.quizService.create(dto);
  }
}
