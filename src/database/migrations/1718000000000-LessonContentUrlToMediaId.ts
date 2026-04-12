import { MigrationInterface, QueryRunner } from 'typeorm';

export class LessonContentUrlToMediaId1718000000000 implements MigrationInterface {
  name = 'LessonContentUrlToMediaId1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lesson_contents" DROP COLUMN "url"`);

    await queryRunner.query(`
      ALTER TABLE "lesson_contents"
        ADD COLUMN "mediaId" uuid,
        ADD CONSTRAINT "FK_lesson_contents_media"
          FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_lesson_contents_mediaId" ON "lesson_contents" ("mediaId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lesson_contents_mediaId"`);
    await queryRunner.query(`
      ALTER TABLE "lesson_contents"
        DROP CONSTRAINT "FK_lesson_contents_media",
        DROP COLUMN "mediaId"
    `);
    await queryRunner.query(`ALTER TABLE "lesson_contents" ADD COLUMN "url" character varying`);
  }
}
