import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearningProgress1719000000000 implements MigrationInterface {
  name = 'AddLearningProgress1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── course_enrollments ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "course_enrollments" (
        "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid        NOT NULL,
        "courseId"    uuid        NOT NULL,
        "completedAt" TIMESTAMP,
        "startedAt"   TIMESTAMP   NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_course_enrollments_user_course" UNIQUE ("userId", "courseId"),
        CONSTRAINT "PK_course_enrollments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "course_enrollments"
        ADD CONSTRAINT "FK_course_enrollments_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_course_enrollments_course"
          FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_course_enrollments_userId"   ON "course_enrollments" ("userId");
      CREATE INDEX "IDX_course_enrollments_courseId" ON "course_enrollments" ("courseId");
    `);

    // ── lesson_progress ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "lesson_progress_status_enum" AS ENUM ('in_progress', 'completed')
    `);

    await queryRunner.query(`
      CREATE TABLE "lesson_progress" (
        "id"          uuid                          NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid                          NOT NULL,
        "lessonId"    uuid                          NOT NULL,
        "courseId"    uuid                          NOT NULL,
        "status"      "lesson_progress_status_enum" NOT NULL DEFAULT 'in_progress',
        "xpAwarded"   boolean                       NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP,
        "createdAt"   TIMESTAMP                     NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP                     NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_lesson_progress_user_lesson_course" UNIQUE ("userId", "lessonId", "courseId"),
        CONSTRAINT "PK_lesson_progress" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "lesson_progress"
        ADD CONSTRAINT "FK_lesson_progress_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_lesson_progress_lesson"
          FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_lesson_progress_course"
          FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lesson_progress_userId_courseId"
        ON "lesson_progress" ("userId", "courseId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lesson_progress_userId_courseId"`);
    await queryRunner.query(`
      ALTER TABLE "lesson_progress"
        DROP CONSTRAINT "FK_lesson_progress_course",
        DROP CONSTRAINT "FK_lesson_progress_lesson",
        DROP CONSTRAINT "FK_lesson_progress_user"
    `);
    await queryRunner.query(`DROP TABLE "lesson_progress"`);
    await queryRunner.query(`DROP TYPE "lesson_progress_status_enum"`);

    await queryRunner.query(`DROP INDEX "IDX_course_enrollments_courseId"`);
    await queryRunner.query(`DROP INDEX "IDX_course_enrollments_userId"`);
    await queryRunner.query(`
      ALTER TABLE "course_enrollments"
        DROP CONSTRAINT "FK_course_enrollments_course",
        DROP CONSTRAINT "FK_course_enrollments_user"
    `);
    await queryRunner.query(`DROP TABLE "course_enrollments"`);
  }
}
