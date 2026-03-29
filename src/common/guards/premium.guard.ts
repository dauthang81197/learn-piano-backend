import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionType } from '../../users/user.entity';

@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException(
        'This content requires a premium subscription.',
      );
    }
    return true;
  }
}

