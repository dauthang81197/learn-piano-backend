import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User, SubscriptionType } from '../../users/user.entity';

@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user: User }>().user;
    if (user?.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException('This content requires a premium subscription.');
    }
    return true;
  }
}
