import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../quiz.entity';

export class QuestionDto {
  @ApiProperty({ example: 'q1', description: 'ID câu hỏi' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: QuestionType, description: 'Loại câu hỏi' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'Nốt nhạc nào là nốt Đô?', description: 'Nội dung câu hỏi' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ type: [String], example: ['C', 'D', 'E', 'F'], description: 'Các lựa chọn' })
  @IsArray()
  options: string[];

  @ApiProperty({ example: 'C', description: 'Đáp án đúng' })
  answer: string | string[];
}

export class CreateQuizDto {
  @ApiProperty({ example: 'uuid-lesson-id', description: 'ID bài học' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ type: [QuestionDto], description: 'Danh sách câu hỏi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @ApiPropertyOptional({ example: 30, description: 'Điểm XP khi hoàn thành quiz', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  xpReward?: number;
}

