import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from '../lessons/lesson.entity';
import { User, SubscriptionType } from '../users/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private coursesRepo: Repository<Course>,
    @InjectRepository(Lesson) private lessonsRepo: Repository<Lesson>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.coursesRepo.findAndCount({
      order: { order: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Khóa học không tồn tại');
    return course;
  }

  async getRoadmap(courseId: string, user: User) {
    const course = await this.findOne(courseId);

    const lessons = await this.lessonsRepo.find({
      where: { courseId },
      order: { order: 'ASC' },
    });

    const completedSet = new Set(user?.completedLessons?.filter(Boolean) ?? []);
    const isPremiumUser = user?.subscription === SubscriptionType.PREMIUM;

    const roadmap = lessons.map((lesson) => {
      const locked = lesson.isPremium && !isPremiumUser;
      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        xpReward: lesson.xpReward,
        isPremium: lesson.isPremium,
        locked,
        isCompleted: completedSet.has(lesson.id),
        content: locked ? null : lesson.content,
      };
    });

    const completedCount = roadmap.filter((l) => l.isCompleted).length;

    return {
      course,
      lessons: roadmap,
      completedCount,
      totalCount: roadmap.length,
      progressPercent: roadmap.length > 0 ? Math.round((completedCount / roadmap.length) * 100) : 0,
    };
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    return this.coursesRepo.save(this.coursesRepo.create(dto));
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    return this.coursesRepo.save(course);
  }

  async remove(id: string): Promise<{ message: string }> {
    const course = await this.findOne(id);
    await this.coursesRepo.remove(course);
    return { message: 'Khóa học đã được xóa' };
  }

  async assignLesson(courseId: string, lessonId: string) {
    await this.findOne(courseId);

    const lesson = await this.lessonsRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');

    lesson.courseId = courseId;
    await this.lessonsRepo.save(lesson);
    return { message: 'Gắn bài học vào khóa học thành công' };
  }

  async removeLesson(courseId: string, lessonId: string) {
    const lesson = await this.lessonsRepo.findOne({ where: { id: lessonId, courseId } });
    if (!lesson) throw new NotFoundException('Bài học không thuộc khóa học này');

    lesson.courseId = null;
    await this.lessonsRepo.save(lesson);
    return { message: 'Gỡ bài học khỏi khóa học thành công' };
  }
}
