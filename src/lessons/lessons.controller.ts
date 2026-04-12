import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('lessons')
@ApiBearerAuth('access-token')
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài học' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách bài học' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Subscription hết hạn hoặc chưa chọn gói' })
  findAll(@CurrentUser() user: User) {
    return this.lessonsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Lấy chi tiết một bài học' })
  @ApiParam({ name: 'id', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Trả về chi tiết bài học' })
  @ApiResponse({ status: 403, description: 'Subscription hết hạn hoặc chưa chọn gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.lessonsService.findOne(id, user);
  }
}
