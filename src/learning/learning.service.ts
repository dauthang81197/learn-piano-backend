import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { LessonProgress, LessonProgressStatus } from './entities/lesson-progress.entity';
import { User, SubscriptionType } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { Lesson } from '../lessons/lesson.entity';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(CourseEnrollment)
    private enrollmentRepo: Repository<CourseEnrollment>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepo: Repository<LessonProgress>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private progressService: ProgressService,
  ) {}

  // ── 1. Bắt đầu học khóa học ────────────────────────────────────────────────

  async startCourse(user: User, courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');

    if (course.isPremium && user.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException('Khóa học này yêu cầu tài khoản Premium');
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { userId: user.id, courseId },
    });

    if (existing) {
      return {
        message: 'Đã đăng ký khóa học trước đó',
        enrollment: this.formatEnrollment(existing),
      };
    }

    const enrollment = await this.enrollmentRepo.save(
      this.enrollmentRepo.create({ userId: user.id, courseId }),
    );

    return {
      message: 'Bắt đầu học khóa học thành công',
      enrollment: this.formatEnrollment(enrollment),
    };
  }

  // ── 2. Lấy danh sách bài học kèm tiến độ ──────────────────────────────────

  async getCourseLessons(user: User, courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');

    const [lessons, progressList, enrollment] = await Promise.all([
      this.lessonRepo.find({ where: { courseId }, order: { order: 'ASC' } }),
      this.lessonProgressRepo.find({ where: { userId: user.id, courseId } }),
      this.enrollmentRepo.findOne({ where: { userId: user.id, courseId } }),
    ]);

    const progressMap = new Map(progressList.map((p) => [p.lessonId, p]));
    const isPremiumUser = user.subscription === SubscriptionType.PREMIUM;

    const mappedLessons = lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      const locked = lesson.isPremium && !isPremiumUser;
      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        xpReward: lesson.xpReward,
        isPremium: lesson.isPremium,
        locked,
        status: progress?.status ?? null,
        isCompleted: progress?.status === LessonProgressStatus.COMPLETED,
        completedAt: progress?.completedAt ?? null,
      };
    });

    const completedCount = mappedLessons.filter((l) => l.isCompleted).length;

    return {
      course,
      lessons: mappedLessons,
      completedCount,
      totalCount: mappedLessons.length,
      progressPercent:
        mappedLessons.length > 0 ? Math.round((completedCount / mappedLessons.length) * 100) : 0,
      enrolledAt: enrollment?.startedAt ?? null,
      courseCompletedAt: enrollment?.completedAt ?? null,
    };
  }

  // ── 3. Bắt đầu học một bài học (mark in_progress) ─────────────────────────

  async startLesson(user: User, courseId: string, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, courseId },
    });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại trong khóa học này');

    if (lesson.isPremium && user.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException('Bài học này yêu cầu tài khoản Premium');
    }

    // Đảm bảo user đã enroll khóa học
    await this.ensureEnrolled(user, courseId);

    const existing = await this.lessonProgressRepo.findOne({
      where: { userId: user.id, lessonId, courseId },
    });

    if (existing) {
      return {
        lessonId,
        status: existing.status,
        message:
          existing.status === LessonProgressStatus.COMPLETED
            ? 'Bài học đã hoàn thành trước đó'
            : 'Đang học bài học này',
      };
    }

    const progress = await this.lessonProgressRepo.save(
      this.lessonProgressRepo.create({
        userId: user.id,
        lessonId,
        courseId,
        status: LessonProgressStatus.IN_PROGRESS,
      }),
    );

    return {
      lessonId,
      status: progress.status,
      message: 'Bắt đầu học bài học',
    };
  }

  // ── 4. Hoàn thành bài học + nhận XP (idempotent) ──────────────────────────

  async completeLesson(user: User, courseId: string, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId, courseId },
    });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại trong khóa học này');

    if (lesson.isPremium && user.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException('Bài học này yêu cầu tài khoản Premium');
    }

    await this.ensureEnrolled(user, courseId);

    let progress = await this.lessonProgressRepo.findOne({
      where: { userId: user.id, lessonId, courseId },
    });

    // Đã hoàn thành trước đó → trả về ngay, không cộng XP lần nữa
    if (progress?.status === LessonProgressStatus.COMPLETED) {
      return {
        alreadyCompleted: true,
        xpGained: 0,
        leveledUp: false,
        currentXp: user.xp,
        currentLevel: user.level,
        message: 'Bài học đã hoàn thành trước đó',
      };
    }

    // Tạo record nếu chưa có (user bấm complete thẳng mà không qua start)
    if (!progress) {
      progress = this.lessonProgressRepo.create({
        userId: user.id,
        lessonId,
        courseId,
      });
    }

    // Cộng XP — load fresh user để tránh stale data
    const freshUser = await this.userRepo.findOne({ where: { id: user.id } });
    const oldLevel = freshUser!.level;
    const updatedUser = await this.progressService.completeLesson(
      freshUser!,
      lessonId,
      lesson.xpReward,
    );

    const xpGained = lesson.xpReward;
    const leveledUp = updatedUser.level > oldLevel;

    // Sync user ref cho response
    user.xp = updatedUser.xp;
    user.level = updatedUser.level;

    progress.status = LessonProgressStatus.COMPLETED;
    progress.completedAt = new Date();
    progress.xpAwarded = true;
    await this.lessonProgressRepo.save(progress);

    // Kiểm tra hoàn thành toàn bộ khóa học
    await this.checkCourseCompletion(user.id, courseId);

    return {
      alreadyCompleted: false,
      xpGained,
      leveledUp,
      currentXp: updatedUser.xp,
      currentLevel: updatedUser.level,
      streak: updatedUser.streak,
      badges: updatedUser.badges.filter(Boolean),
      message: leveledUp
        ? `Hoàn thành! Bạn vừa lên cấp ${updatedUser.level}! 🎉`
        : 'Hoàn thành bài học thành công!',
    };
  }

  // ── 5. Lấy bài học tiếp theo ───────────────────────────────────────────────

  async getNextLesson(user: User, courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');

    const [lessons, completedProgress] = await Promise.all([
      this.lessonRepo.find({ where: { courseId }, order: { order: 'ASC' } }),
      this.lessonProgressRepo.find({
        where: {
          userId: user.id,
          courseId,
          status: LessonProgressStatus.COMPLETED,
        },
      }),
    ]);

    const completedSet = new Set(completedProgress.map((p) => p.lessonId));
    const isPremiumUser = user.subscription === SubscriptionType.PREMIUM;

    const nextLesson = lessons.find(
      (l) => !completedSet.has(l.id) && (!l.isPremium || isPremiumUser),
    );

    if (!nextLesson) {
      return {
        message: 'Bạn đã hoàn thành tất cả bài học trong khóa học này!',
        lesson: null,
      };
    }

    return {
      lesson: {
        id: nextLesson.id,
        title: nextLesson.title,
        type: nextLesson.type,
        order: nextLesson.order,
        xpReward: nextLesson.xpReward,
        isPremium: nextLesson.isPremium,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async ensureEnrolled(user: User, courseId: string): Promise<void> {
    const existing = await this.enrollmentRepo.findOne({
      where: { userId: user.id, courseId },
    });
    if (!existing) {
      await this.enrollmentRepo.save(this.enrollmentRepo.create({ userId: user.id, courseId }));
    }
  }

  private async checkCourseCompletion(userId: string, courseId: string): Promise<void> {
    const [allLessons, completedLessons] = await Promise.all([
      this.lessonRepo.find({ where: { courseId } }),
      this.lessonProgressRepo.find({
        where: { userId, courseId, status: LessonProgressStatus.COMPLETED },
      }),
    ]);

    if (allLessons.length > 0 && completedLessons.length >= allLessons.length) {
      await this.enrollmentRepo.update({ userId, courseId }, { completedAt: new Date() });
    }
  }

  private formatEnrollment(e: CourseEnrollment) {
    return {
      id: e.id,
      courseId: e.courseId,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
    };
  }
}
