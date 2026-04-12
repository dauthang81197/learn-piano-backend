import { Controller, Post, Put, Delete, Param, Body, UseGuards, Query, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PaginateQueryDto } from './dto/paginate-query.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('admin/courses')
@ApiBearerAuth('access-token')
@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khóa học piano (có phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học phân trang' })
  findAll(@Query() query: PaginateQueryDto) {
    return this.coursesService.findAll(query.page, query.limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo khóa học mới (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo khóa học thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật khóa học (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khóa học (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post(':courseId/lessons/:lessonId')
  @ApiOperation({ summary: 'Gắn bài học vào khóa học (Admin only)' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 201, description: 'Gắn thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học hoặc bài học' })
  assignLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    return this.coursesService.assignLesson(courseId, lessonId);
  }

  @Delete(':courseId/lessons/:lessonId')
  @ApiOperation({ summary: 'Gỡ bài học khỏi khóa học (Admin only)' })
  @ApiParam({ name: 'courseId', description: 'ID khóa học' })
  @ApiParam({ name: 'lessonId', description: 'ID bài học' })
  @ApiResponse({ status: 200, description: 'Gỡ thành công' })
  @ApiResponse({ status: 404, description: 'Bài học không thuộc khóa học này' })
  removeLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    return this.coursesService.removeLesson(courseId, lessonId);
  }

  @Get(':id/roadmap')
  @ApiOperation({ summary: 'Lấy lộ trình học của một khóa học' })
  @ApiParam({ name: 'id', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Lộ trình học với trạng thái hoàn thành từng bài' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  getRoadmap(@Param('id') id: string, @CurrentUser() user: User) {
    return this.coursesService.getRoadmap(id, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một khóa học' })
  @ApiParam({ name: 'id', description: 'ID khóa học' })
  @ApiResponse({ status: 200, description: 'Chi tiết khóa học' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khóa học' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }
}
