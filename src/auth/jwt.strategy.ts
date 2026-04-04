import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(UserSubscription)
    private subscriptionsRepo: Repository<UserSubscription>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'default_secret',
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();

    // Lấy subscription mới nhất (bất kỳ status) để guard kiểm tra chi tiết
    const activeSubscription = await this.subscriptionsRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      relations: ['plan'],
    });

    user.activeSubscription = activeSubscription ?? null;
    return user;
  }
}
