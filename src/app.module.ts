import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { LessonsModule } from './lessons/lessons.module';
import { QuizModule } from './quiz/quiz.module';
import { ProgressModule } from './progress/progress.module';
import { CoursesModule } from './courses/courses.module';
import { MediaModule } from './media/media.module';
import { Media } from './media/media.entity';
import { User } from './users/user.entity';
import { Lesson } from './lessons/lesson.entity';
import { LessonContent } from './lessons/lesson-content.entity';
import { Quiz } from './quiz/quiz.entity';
import { Course } from './courses/course.entity';
import { SubscriptionPlan } from './subscription/entities/subscription-plan.entity';
import { UserSubscription } from './subscription/entities/user-subscription.entity';
import { SubscriptionInvoice } from './subscription/entities/subscription-invoice.entity';
import { PaymentMethod } from './subscription/entities/payment-method.entity';
import { SubscriptionEvent } from './subscription/entities/subscription-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'learn_piano'),
        entities: [
          User,
          Lesson,
          LessonContent,
          Quiz,
          Course,
          SubscriptionPlan,
          UserSubscription,
          SubscriptionInvoice,
          PaymentMethod,
          SubscriptionEvent,
          Media,
        ],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations_history',
        synchronize: false, // ← tắt hoàn toàn, dùng migration thay thế
        migrationsRun: true, // ← tự chạy migration pending khi app khởi động
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    SubscriptionModule,
    LessonsModule,
    QuizModule,
    ProgressModule,
    CoursesModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
