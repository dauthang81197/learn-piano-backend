import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { LessonContent } from './lesson-content.entity';
import { User, SubscriptionType, UserRole } from '../users/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson) private lessonsRepo: Repository<Lesson>,
    @InjectRepository(LessonContent) private contentsRepo: Repository<LessonContent>,
  ) {}

  async findAll(user?: User): Promise<Lesson[]> {
    const lessons = await this.lessonsRepo
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.contents', 'content')
      .orderBy('lesson.order', 'ASC')
      .addOrderBy('content.order', 'ASC')
      .getMany();

    if (!user || user.subscription !== SubscriptionType.PREMIUM) {
      return lessons.map((l) =>
        l.isPremium ? ({ ...l, contents: [], locked: true } as unknown as Lesson) : l,
      );
    }
    return lessons;
  }

  async findOne(id: string, user?: User): Promise<Lesson> {
    const lesson = await this.lessonsRepo
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.contents', 'content')
      .where('lesson.id = :id', { id })
      .orderBy('content.order', 'ASC')
      .getOne();

    if (!lesson) throw new NotFoundException('Lesson not found');

    if (
      lesson.isPremium &&
      user?.subscription !== SubscriptionType.PREMIUM &&
      user?.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('This lesson requires a premium subscription');
    }
    return lesson;
  }

  async create(dto: CreateLessonDto): Promise<Lesson> {
    const { contents, ...lessonData } = dto;
    const lesson = this.lessonsRepo.create(lessonData);
    const saved = await this.lessonsRepo.save(lesson);

    if (contents?.length) {
      const blocks = contents.map((block) =>
        this.contentsRepo.create({ ...block, lessonId: saved.id }),
      );
      saved.contents = await this.contentsRepo.save(blocks);
    } else {
      saved.contents = [];
    }

    return saved;
  }

  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonsRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const { contents, ...lessonData } = dto;
    Object.assign(lesson, lessonData);
    await this.lessonsRepo.save(lesson);

    if (contents !== undefined) {
      // Xóa toàn bộ blocks cũ, thay bằng blocks mới
      await this.contentsRepo.delete({ lessonId: id });
      if (contents.length) {
        const blocks = contents.map((block) =>
          this.contentsRepo.create({ ...block, lessonId: id }),
        );
        lesson.contents = await this.contentsRepo.save(blocks);
      } else {
        lesson.contents = [];
      }
    }

    return lesson;
  }

  async remove(id: string): Promise<{ message: string }> {
    const lesson = await this.lessonsRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonsRepo.remove(lesson);
    return { message: 'Lesson deleted successfully' };
  }
}
