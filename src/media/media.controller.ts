import { Controller, Get, Param, UseGuards, Res, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('media')
@ApiBearerAuth('access-token')
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách media' })
  @ApiResponse({ status: 200, description: 'Danh sách media' })
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một file media' })
  @ApiParam({ name: 'id', description: 'ID media' })
  @ApiResponse({ status: 200, description: 'Thông tin file' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream file trực tiếp từ R2' })
  @ApiParam({ name: 'id', description: 'ID media' })
  @ApiResponse({ status: 200, description: 'Binary stream của file' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async stream(@Param('id') id: string, @Res() res: Response) {
    const { stream, media } = await this.mediaService.getStream(id);
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
    res.setHeader('Content-Length', media.size.toString());
    stream.pipe(res);
  }

  @Get(':id/presigned-url')
  @ApiOperation({ summary: 'Lấy presigned URL tạm thời để truy cập file R2' })
  @ApiParam({ name: 'id', description: 'ID media' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'Thời gian hết hạn (giây), mặc định 3600',
  })
  @ApiResponse({ status: 200, description: 'Presigned URL và thời gian hết hạn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  getPresignedUrl(@Param('id') id: string, @Query('expiresIn') expiresIn?: string) {
    return this.mediaService.getPresignedUrl(id, expiresIn ? parseInt(expiresIn) : 3600);
  }
}
