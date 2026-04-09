import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '../lesson.entity';
import { CreateLessonContentDto } from './create-lesson-content.dto';

export class CreateLessonDto {
  @ApiProperty({ example: 'Bài 1: Nốt nhạc cơ bản', description: 'Tiêu đề bài học' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: [CreateLessonContentDto],
    description: 'Danh sách content blocks theo thứ tự',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonContentDto)
  contents: CreateLessonContentDto[];

  @ApiProperty({ enum: LessonType, description: 'Loại bài học' })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách ID quiz' })
  @IsArray()
  @IsOptional()
  quizIds?: string[];

  @ApiProperty({ example: 50, description: 'Điểm XP nhận được khi hoàn thành', minimum: 0 })
  @IsNumber()
  @Min(0)
  xpReward: number;

  @ApiProperty({ example: 1, description: 'Thứ tự bài học', minimum: 0 })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiPropertyOptional({ example: false, description: 'Bài học yêu cầu Premium?' })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: 'uuid-of-course', description: 'ID khóa học chứa bài này' })
  @IsString()
  @IsOptional()
  courseId?: string;
}
