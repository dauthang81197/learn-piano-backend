import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email của người dùng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu (ít nhất 8 ký tự)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên hiển thị' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
