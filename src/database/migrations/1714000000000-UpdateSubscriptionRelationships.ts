import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cập nhật sau khi thêm bidirectional relationships vào các entity:
 *
 *  User ──1:N──► UserSubscription    (user.subscriptions)
 *  User ──1:N──► PaymentMethod       (user.paymentMethods)
 *  User ──1:N──► SubscriptionInvoice (user.invoices)
 *  User ──1:N──► SubscriptionEvent   (user.subscriptionEvents)
 *
 * Thay đổi DB thực tế:
 *  1. Thêm ON DELETE RESTRICT tường minh cho FK subscription_plans → user_subscriptions
 *     (ngăn xóa plan khi còn subscription đang dùng)
 *  2. Thêm composite indexes tối ưu cho các relation query phổ biến
 */
export class UpdateSubscriptionRelationships1714000000000 implements MigrationInterface {
  name = 'UpdateSubscriptionRelationships1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Làm rõ ON DELETE RESTRICT trên FK plan ──────────────────────────
    // Migration trước tạo FK này không có ON DELETE → mặc định NO ACTION.
    // Đặt RESTRICT tường minh để PostgreSQL báo lỗi ngay khi cố xóa plan
    // còn subscription đang tham chiếu.
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
        DROP CONSTRAINT IF EXISTS "FK_user_subscriptions_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
        ADD CONSTRAINT "FK_user_subscriptions_plan"
          FOREIGN KEY ("planId")
          REFERENCES "subscription_plans"("id")
          ON DELETE RESTRICT
    `);

    // ── 2. Composite indexes cho relation queries ──────────────────────────

    // user_subscriptions: truy vấn subscription active/trialing của 1 user
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_userId_status"
        ON "user_subscriptions" ("userId", "status")
    `);

    // user_subscriptions: cron job tìm subscription sắp hết hạn (next billing)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_userId_nextBillingDate"
        ON "user_subscriptions" ("userId", "nextBillingDate")
    `);

    // payment_methods: tìm phương thức thanh toán mặc định của user
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_methods_userId_isDefault"
        ON "payment_methods" ("userId", "isDefault")
    `);

    // subscription_invoices: lịch sử hóa đơn của user theo trạng thái
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_invoices_userId_status"
        ON "subscription_invoices" ("userId", "status")
    `);

    // subscription_invoices: tìm hóa đơn pending/failed để retry
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_invoices_subscriptionId_status"
        ON "subscription_invoices" ("subscriptionId", "status")
    `);

    // subscription_events: timeline sự kiện của user (order by createdAt)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_events_userId_createdAt"
        ON "subscription_events" ("userId", "createdAt" DESC)
    `);

    // subscription_events: lọc theo loại sự kiện trong 1 subscription
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscription_events_subscriptionId_eventType"
        ON "subscription_events" ("subscriptionId", "eventType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Xóa composite indexes ──────────────────────────────────────────────
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_subscription_events_subscriptionId_eventType"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_events_userId_createdAt"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_subscription_invoices_subscriptionId_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_invoices_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_methods_userId_isDefault"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_userId_nextBillingDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_userId_status"`);

    // ── Revert FK về trạng thái không có ON DELETE (như migration 1713) ───
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
        DROP CONSTRAINT IF EXISTS "FK_user_subscriptions_plan"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
        ADD CONSTRAINT "FK_user_subscriptions_plan"
          FOREIGN KEY ("planId")
          REFERENCES "subscription_plans"("id")
    `);
  }
}
