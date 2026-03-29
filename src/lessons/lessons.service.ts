import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { User, SubscriptionType } from '../users/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(@InjectRepository(Lesson) private lessonsRepo: Repository<Lesson>) {}

  async findAll(user?: User): Promise<Lesson[]> {
    const lessons = await this.lessonsRepo.find({
      order: { order: 'ASC' },
    });

    // If not premium, mark premium lessons but still list them
    if (!user || user.subscription !== SubscriptionType.PREMIUM) {
      return lessons.map((l) =>
        l.isPremium ? ({ ...l, content: null, locked: true } as unknown as Lesson) : l,
      );
    }
    return lessons;
  }

  async findOne(id: string, user?: User): Promise<Lesson> {
    const lesson = await this.lessonsRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (lesson.isPremium && user?.subscription !== SubscriptionType.PREMIUM) {
      throw new ForbiddenException('This lesson requires a premium subscription');
    }
    return lesson;
  }

  async create(dto: CreateLessonDto): Promise<Lesson> {
    const lesson = this.lessonsRepo.create(dto);
    return this.lessonsRepo.save(lesson);
  }

  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.findOne(id);
    Object.assign(lesson, dto);
    return this.lessonsRepo.save(lesson);
  }

  async remove(id: string): Promise<{ message: string }> {
    const lesson = await this.findOne(id);
    await this.lessonsRepo.remove(lesson);
    return { message: 'Lesson deleted successfully' };
  }
}
