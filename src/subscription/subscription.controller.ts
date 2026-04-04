import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { SubscriptionService } from './subscription.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { SelectPlanDto } from './dto/select-plan.dto';

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách gói subscription (public)' })
  @ApiResponse({ status: 200, description: 'Danh sách gói đang active' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  // ── Authenticated ─────────────────────────────────────────────────────────

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Xem trạng thái subscription + số ngày dùng thử còn lại',
  })
  @ApiResponse({
    status: 200,
    description: 'needsPlanSelection=true → chưa chọn gói | trialDaysLeft → ngày còn lại',
  })
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionService.getMySubscription(user.id);
  }

  @Post('select-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Chọn gói lần đầu sau khi đăng ký/đăng nhập (free = 7 ngày dùng thử)',
  })
  @ApiResponse({ status: 201, description: 'Kích hoạt dùng thử thành công' })
  @ApiResponse({
    status: 400,
    description: 'Đã có subscription hoặc gói không hợp lệ',
  })
  selectPlan(@CurrentUser() user: User, @Body() dto: SelectPlanDto) {
    return this.subscriptionService.selectPlan(user, dto);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Nâng cấp lên Premium (yêu cầu Stripe payment method)',
  })
  @ApiResponse({ status: 201, description: 'Nâng cấp thành công' })
  upgrade(@CurrentUser() user: User, @Body() dto: UpgradeSubscriptionDto) {
    return this.subscriptionService.upgradeSubscription(user, dto);
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Hủy subscription (cancel_at_period_end)' })
  @ApiResponse({ status: 200, description: 'Hủy thành công' })
  cancel(@CurrentUser() user: User) {
    return this.subscriptionService.cancelSubscription(user);
  }
}
