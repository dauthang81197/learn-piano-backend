import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoursesTable1712000000000 implements MigrationInterface {
  name = 'AddCoursesTable1712000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "title"       character varying NOT NULL,
        "description" text              NOT NULL,
        "thumbnail"   character varying,
        "isPremium"   boolean           NOT NULL DEFAULT false,
        "order"       integer           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "lessons" ADD COLUMN "courseId" character varying
    `);

    await queryRunner.query(`CREATE INDEX "IDX_courses_order"    ON "courses" ("order")`);
    await queryRunner.query(`CREATE INDEX "IDX_lessons_courseId" ON "lessons" ("courseId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lessons_courseId"`);
    await queryRunner.query(`DROP INDEX "IDX_courses_order"`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "courseId"`);
    await queryRunner.query(`DROP TABLE "courses"`);
  }
}

