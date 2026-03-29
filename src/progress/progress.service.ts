import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionType } from '../users/user.entity';

const BADGES = {
  BEGINNER: 'Beginner',
  STREAK_7: 'Streak 7',
  INTERMEDIATE: 'Intermediate',
  STREAK_30: 'Streak 30',
  EXPERT: 'Expert',
};

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  /** Award XP and update level, streak, badges, completedLessons */
  async addXp(user: User, xp: number, lessonId?: string): Promise<User> {
    user.xp += xp;
    user.level = Math.floor(user.xp / 100);

    this.updateStreak(user);

    if (lessonId && !user.completedLessons.includes(lessonId)) {
      user.completedLessons = [...user.completedLessons, lessonId];
    }

    this.evaluateBadges(user);

    return this.usersRepo.save(user);
  }

  private updateStreak(user: User): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastActiveDate) {
      user.streak = 1;
    } else {
      const last = new Date(user.lastActiveDate);
      last.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
      // diffDays === 0 means same day, streak unchanged
    }

    user.lastActiveDate = today;
  }

  private evaluateBadges(user: User): void {
    const badges = new Set(user.badges.filter(Boolean));

    if (user.completedLessons.filter(Boolean).length >= 1) {
      badges.add(BADGES.BEGINNER);
    }
    if (user.completedLessons.filter(Boolean).length >= 10) {
      badges.add(BADGES.INTERMEDIATE);
    }
    if (user.completedLessons.filter(Boolean).length >= 50) {
      badges.add(BADGES.EXPERT);
    }
    if (user.streak >= 7) {
      badges.add(BADGES.STREAK_7);
    }
    if (user.streak >= 30) {
      badges.add(BADGES.STREAK_30);
    }

    user.badges = Array.from(badges);
  }

  async getProgress(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      badges: user.badges.filter(Boolean),
      subscription: user.subscription,
      completedLessons: user.completedLessons.filter(Boolean),
      lastActiveDate: user.lastActiveDate,
    };
  }

  async getLeaderboard(): Promise<
    { rank: number; name: string; xp: number; level: number; badges: string[] }[]
  > {
    const users = await this.usersRepo.find({
      order: { xp: 'DESC' },
      take: 50,
    });

    return users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      xp: u.xp,
      level: u.level,
      badges: u.badges.filter(Boolean),
    }));
  }

  /** Award XP for completing a theory lesson */
  async completeLesson(user: User, lessonId: string, xpReward: number): Promise<User> {
    if (user.completedLessons.includes(lessonId)) {
      return user; // Already completed, no duplicate XP
    }
    return this.addXp(user, xpReward, lessonId);
  }
}

