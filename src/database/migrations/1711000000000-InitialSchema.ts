import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711000000000 implements MigrationInterface {
  name = 'InitialSchema1711000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── ENUMS ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum"
        AS ENUM('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."users_subscription_enum"
        AS ENUM('free', 'premium')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."lessons_type_enum"
        AS ENUM('theory', 'quiz')
    `);

    // ── USERS ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                   uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "email"                character varying NOT NULL,
        "passwordHash"         character varying,
        "name"                 character varying NOT NULL,
        "role"                 "public"."users_role_enum"         NOT NULL DEFAULT 'user',
        "subscription"         "public"."users_subscription_enum" NOT NULL DEFAULT 'free',
        "xp"                   integer           NOT NULL DEFAULT 0,
        "level"                integer           NOT NULL DEFAULT 1,
        "streak"               integer           NOT NULL DEFAULT 0,
        "badges"               text              NOT NULL DEFAULT '',
        "lastActiveDate"       TIMESTAMP,
        "completedLessons"     text              NOT NULL DEFAULT '',
        "stripeCustomerId"     character varying,
        "stripeSubscriptionId" character varying,
        "createdAt"            TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users"       PRIMARY KEY ("id")
      )
    `);

    // ── LESSONS ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lessons" (
        "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "title"     character varying NOT NULL,
        "content"   text              NOT NULL,
        "type"      "public"."lessons_type_enum" NOT NULL DEFAULT 'theory',
        "quizIds"   text              NOT NULL DEFAULT '',
        "xpReward"  integer           NOT NULL DEFAULT 10,
        "order"     integer           NOT NULL DEFAULT 0,
        "isPremium" boolean           NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lessons" PRIMARY KEY ("id")
      )
    `);

    // ── QUIZZES ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "quizzes" (
        "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "lessonId"  character varying NOT NULL,
        "questions" jsonb             NOT NULL,
        "xpReward"  integer           NOT NULL DEFAULT 20,
        "createdAt" TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quizzes" PRIMARY KEY ("id")
      )
    `);

    // ── INDEXES ────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_users_email"      ON "users"   ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_quizzes_lessonId" ON "quizzes" ("lessonId")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_order"    ON "lessons" ("order")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lessons_order"`);
    await queryRunner.query(`DROP INDEX "IDX_quizzes_lessonId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP TABLE "lessons"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."lessons_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_subscription_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}

