import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';
import type { Response } from 'express';
@ApiTags('admin/media')
@ApiBearerAuth('access-token')
@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload ảnh hoặc video lên Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload thành công, trả về thông tin file' })
  @ApiResponse({ status: 400, description: 'File type không hợp lệ hoặc quá lớn' })
  upload(
    @UploadedFile(
      new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 })] }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.upload(file, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả media đã upload' })
  @ApiResponse({ status: 200, description: 'Danh sách media' })
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một file media' })
  @ApiParam({ name: 'id', description: 'ID media' })
  @ApiResponse({ status: 200, description: 'Thông tin file' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa file khỏi R2 và database' })
  @ApiParam({ name: 'id', description: 'ID media' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
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
