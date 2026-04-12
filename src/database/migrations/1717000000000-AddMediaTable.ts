import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaTable1717000000000 implements MigrationInterface {
  name = 'AddMediaTable1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."media_type_enum" AS ENUM('image', 'video')
    `);

    await queryRunner.query(`
      CREATE TABLE "media" (
        "id"             uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "originalName"   character varying NOT NULL,
        "filename"       character varying NOT NULL,
        "key"            character varying NOT NULL,
        "url"            character varying NOT NULL,
        "type"           "public"."media_type_enum" NOT NULL,
        "mimeType"       character varying NOT NULL,
        "size"           bigint            NOT NULL,
        "uploadedById"   uuid,
        "createdAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media" PRIMARY KEY ("id"),
        CONSTRAINT "FK_media_user"
          FOREIGN KEY ("uploadedById")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_type" ON "media" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_media_uploadedById" ON "media" ("uploadedById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_media_uploadedById"`);
    await queryRunner.query(`DROP INDEX "IDX_media_type"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TYPE "public"."media_type_enum"`);
  }
}
