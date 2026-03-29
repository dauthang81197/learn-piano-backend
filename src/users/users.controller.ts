import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin profile của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin profile' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  getProfile(@CurrentUser() user: User) {
    const { passwordHash: _passwordHash, ...profile } = user;
    return profile;
  }
}
