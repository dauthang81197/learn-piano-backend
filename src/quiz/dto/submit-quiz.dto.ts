import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ example: 'q1', description: 'ID câu hỏi' })
  questionId: string;

  @ApiProperty({ example: 'C', description: 'Câu trả lời (chuỗi hoặc mảng chuỗi)' })
  answer: string | string[];
}

export class SubmitQuizDto {
  @ApiProperty({ type: [AnswerDto], description: 'Danh sách câu trả lời' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

