import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '../lesson-content.entity';

export class CreateLessonContentDto {
  @ApiProperty({ enum: ContentBlockType, description: 'Loại block nội dung' })
  @IsEnum(ContentBlockType)
  type: ContentBlockType;

  @ApiProperty({ example: 0, description: 'Thứ tự hiển thị của block', minimum: 0 })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional({ example: '<p>Lý thuyết về nốt Đô...</p>', description: 'Nội dung text (chỉ dùng cho type=text)' })
  @IsString()
  @IsOptional()
  textData?: string;

  @ApiPropertyOptional({ example: 'https://...', description: 'URL video hoặc ảnh (dùng cho type=video/image)' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ example: 120, description: 'Thời lượng video tính bằng giây (chỉ dùng cho type=video)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 'Sheet nhạc bài Cho Tôi', description: 'Chú thích ảnh (chỉ dùng cho type=image)' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ example: 'Hình ảnh sheet nhạc', description: 'Alt text cho ảnh (chỉ dùng cho type=image)' })
  @IsString()
  @IsOptional()
  altText?: string;
}
