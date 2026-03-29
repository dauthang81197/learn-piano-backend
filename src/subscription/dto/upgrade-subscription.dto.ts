import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: 'pm_1234567890', description: 'Stripe Payment Method ID' })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
