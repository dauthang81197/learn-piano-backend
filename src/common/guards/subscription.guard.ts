import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { SubscriptionStatus } from '../../subscription/entities/user-subscription.entity';

/**
 * Kiểm tra subscription hợp lệ sau khi JwtAuthGuard đã chạy.
 * Đọc trực tiếp từ `request.user.activeSubscription` (được JwtStrategy populate).
 *
 * Luồng:
 *  - Chưa chọn gói        → 403 NO_SUBSCRIPTION
 *  - Trial đã hết 7 ngày  → 403 TRIAL_EXPIRED
 *  - Đã hủy / hết hạn     → 403 SUBSCRIPTION_EXPIRED
 *  - Trial còn hạn / ACTIVE / PAST_DUE (grace) → cho qua
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    // Chưa authenticate → để JwtAuthGuard xử lý (trả 401)
    if (!user) return true;

    const sub = user.activeSubscription;

    // ── Chưa chọn gói ────────────────────────────────────────────────────
    if (!sub) {
      throw new ForbiddenException({
        code: 'NO_SUBSCRIPTION',
        message:
          'Vui lòng chọn gói subscription để tiếp tục. ' +
          'Gói Free cho phép dùng thử miễn phí 7 ngày.',
      });
    }

    const now = new Date();

    // ── Trial đã hết hạn ─────────────────────────────────────────────────
    if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndDate && sub.trialEndDate < now) {
      throw new ForbiddenException({
        code: 'TRIAL_EXPIRED',
        message:
          'Thời gian dùng thử 7 ngày đã kết thúc. ' +
          'Vui lòng nâng cấp lên Premium để tiếp tục học.',
        trialEndDate: sub.trialEndDate,
      });
    }

    // ── Đã hủy và hết chu kỳ ─────────────────────────────────────────────
    if (sub.status === SubscriptionStatus.CANCELED && sub.endDate && sub.endDate < now) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_CANCELED',
        message: 'Subscription đã bị hủy và hết hạn. Vui lòng đăng ký lại.',
      });
    }

    // ── Đã hết hạn ───────────────────────────────────────────────────────
    if (sub.status === SubscriptionStatus.EXPIRED) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Subscription đã hết hạn. Vui lòng gia hạn để tiếp tục.',
      });
    }

    // TRIALING (còn hạn), ACTIVE, PAST_DUE (grace period) → cho qua ✅
    return true;
  }
}
