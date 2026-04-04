import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserSubscription } from '../subscription/entities/user-subscription.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthResponse {
  accessToken: string;
  /** true = user chưa chọn gói nào → frontend hiện modal chọn gói */
  needsPlanSelection: boolean;
  /** trialing | active | expired | canceled | null */
  subscriptionStatus: string | null;
  /** Số ngày dùng thử còn lại; null nếu không trong trial */
  trialDaysLeft: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(UserSubscription)
    private subscriptionsRepo: Repository<UserSubscription>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });
    await this.usersRepo.save(user);

    // User mới → chưa có subscription
    return {
      ...this.signToken(user),
      needsPlanSelection: true,
      subscriptionStatus: null,
      trialDaysLeft: null,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Lấy subscription mới nhất để trả về trạng thái cho frontend
    const sub = await this.subscriptionsRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    const trialDaysLeft = sub?.trialEndDate
      ? Math.max(0, Math.ceil((sub.trialEndDate.getTime() - Date.now()) / 86_400_000))
      : null;

    return {
      ...this.signToken(user),
      needsPlanSelection: !sub,
      subscriptionStatus: sub?.status ?? null,
      trialDaysLeft,
    };
  }

  private signToken(user: User): { accessToken: string } {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
