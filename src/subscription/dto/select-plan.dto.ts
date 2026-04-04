import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectPlanDto {
  @ApiProperty({
    example: 'free',
    description: 'Slug của gói cần chọn: free | premium_monthly | premium_yearly',
    enum: ['free', 'premium_monthly', 'premium_yearly'],
  })
  @IsString()
  @IsIn(['free', 'premium_monthly', 'premium_yearly'])
  planSlug: string;
}
