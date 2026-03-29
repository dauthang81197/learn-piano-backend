import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Piano for Beginners' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Khóa học piano dành cho người mới bắt đầu' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}
