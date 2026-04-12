import { Controller, Post, Put, Delete, Param, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('admin/lessons')
@ApiBearerAuth('access-token')
@Controller('admin/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài học mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo bài học thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật bài học (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài học (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách bài học' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Subscription hết hạn hoặc chưa chọn gói' })
  findAll(@CurrentUser() user: User) {
    return this.lessonsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bài học' })
  @ApiParam({ name: 'id', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Trả về chi tiết bài học' })
  @ApiResponse({ status: 403, description: 'Subscription hết hạn hoặc chưa chọn gói' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.lessonsService.findOne(id, user);
  }
}
