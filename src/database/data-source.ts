import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Quiz } from '../quiz/quiz.entity';

config(); // load .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'learn_piano',
  entities: [User, Lesson, Quiz],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations_history',
  synchronize: false,
  logging: true,
});
