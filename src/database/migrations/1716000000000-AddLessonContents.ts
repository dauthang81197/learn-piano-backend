import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonContents1716000000000 implements MigrationInterface {
  name = 'AddLessonContents1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo enum type cho ContentBlockType
    await queryRunner.query(`
      CREATE TYPE "lesson_contents_type_enum" AS ENUM ('text', 'video', 'image')
    `);

    // Tạo bảng lesson_contents
    await queryRunner.query(`
      CREATE TABLE "lesson_contents" (
        "id"         uuid                              NOT NULL DEFAULT uuid_generate_v4(),
        "lessonId"   uuid                              NOT NULL,
        "type"       "lesson_contents_type_enum"       NOT NULL,
        "order"      integer                           NOT NULL DEFAULT 0,
        "textData"   text,
        "url"        character varying,
        "duration"   integer,
        "caption"    character varying,
        "altText"    character varying,
        "createdAt"  TIMESTAMP                         NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP                         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_contents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lesson_contents_lesson"
          FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lesson_contents_lessonId" ON "lesson_contents" ("lessonId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lesson_contents_order" ON "lesson_contents" ("lessonId", "order")
    `);

    // Làm cho cột content trên bảng lessons trở thành nullable
    await queryRunner.query(`
      ALTER TABLE "lessons" ALTER COLUMN "content" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "content" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX "IDX_lesson_contents_order"`);
    await queryRunner.query(`DROP INDEX "IDX_lesson_contents_lessonId"`);
    await queryRunner.query(`DROP TABLE "lesson_contents"`);
    await queryRunner.query(`DROP TYPE "lesson_contents_type_enum"`);
  }
}
