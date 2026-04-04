import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cập nhật gói Free: trialDays = 7
 * → User chọn free sẽ được dùng thử 7 ngày miễn phí
 */
export class UpdateFreePlanTrialDays1715000000000 implements MigrationInterface {
  name = 'UpdateFreePlanTrialDays1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "subscription_plans"
      SET "trialDays" = 7
      WHERE "slug" = 'free'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "subscription_plans"
      SET "trialDays" = 0
      WHERE "slug" = 'free'
    `);
  }
}
