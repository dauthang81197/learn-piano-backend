import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { PaginateQueryDto } from './dto/paginate-query.dto';

@ApiTags('courses')
@ApiBearerAuth('access-token')
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khóa học piano (có phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học phân trang' })
  findAll(@Query() query: PaginateQueryDto) {
    return this.coursesService.findAll(query.page, query.limit);
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
