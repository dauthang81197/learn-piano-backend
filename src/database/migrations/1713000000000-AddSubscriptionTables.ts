import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionTables1713000000000 implements MigrationInterface {
  name = 'AddSubscriptionTables1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ENUMS ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."billing_cycle_enum"
        AS ENUM('monthly', 'yearly', 'lifetime')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."subscription_status_enum"
        AS ENUM('trialing', 'active', 'past_due', 'canceled', 'expired', 'paused')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."payment_method_type_enum"
        AS ENUM('card', 'bank_transfer', 'paypal')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invoice_status_enum"
        AS ENUM('pending', 'paid', 'failed', 'refunded', 'void')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invoice_type_enum"
        AS ENUM('initial', 'renewal', 'prorate', 'refund')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."subscription_event_type_enum"
        AS ENUM(
          'created', 'activated', 'canceled', 'expired', 'renewed',
          'changed_plan', 'payment_failed', 'payment_succeeded',
          'trial_started', 'trial_ended', 'paused', 'resumed'
        )
    `);

    // ── subscription_plans ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "name"         character varying NOT NULL,
        "slug"         character varying NOT NULL,
        "price"        numeric(10,2)     NOT NULL DEFAULT 0,
        "currency"     character varying NOT NULL DEFAULT 'usd',
        "billingCycle" "public"."billing_cycle_enum",
        "trialDays"    integer           NOT NULL DEFAULT 0,
        "features"     jsonb             NOT NULL DEFAULT '[]',
        "isActive"     boolean           NOT NULL DEFAULT true,
        "stripePriceId" character varying,
        "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_plans_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_subscription_plans"       PRIMARY KEY ("id")
      )
    `);

    // ── payment_methods ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "payment_methods" (
        "id"                     uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid              NOT NULL,
        "type"                   "public"."payment_method_type_enum" NOT NULL DEFAULT 'card',
        "stripePaymentMethodId"  character varying,
        "last4"                  character varying,
        "brand"                  character varying,
        "expMonth"               integer,
        "expYear"                integer,
        "isDefault"              boolean           NOT NULL DEFAULT false,
        "createdAt"              TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_methods_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── user_subscriptions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_subscriptions" (
        "id"                   uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "userId"               uuid      NOT NULL,
        "planId"               uuid      NOT NULL,
        "status"               "public"."subscription_status_enum" NOT NULL DEFAULT 'active',
        "startDate"            TIMESTAMP NOT NULL,
        "endDate"              TIMESTAMP,
        "trialEndDate"         TIMESTAMP,
        "nextBillingDate"      TIMESTAMP,
        "cancelAtPeriodEnd"    boolean   NOT NULL DEFAULT false,
        "stripeSubscriptionId" character varying,
        "paymentMethodId"      uuid,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_subscriptions_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_subscriptions_plan"
          FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id"),
        CONSTRAINT "FK_user_subscriptions_payment_method"
          FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL
      )
    `);

    // ── subscription_invoices ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscription_invoices" (
        "id"                     uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                 uuid          NOT NULL,
        "subscriptionId"         uuid          NOT NULL,
        "amount"                 numeric(10,2) NOT NULL,
        "currency"               character varying NOT NULL DEFAULT 'usd',
        "status"                 "public"."invoice_status_enum"  NOT NULL DEFAULT 'pending',
        "type"                   "public"."invoice_type_enum"    NOT NULL DEFAULT 'renewal',
        "stripeInvoiceId"        character varying,
        "stripePaymentIntentId"  character varying,
        "paidAt"                 TIMESTAMP,
        "failedAt"               TIMESTAMP,
        "dueDate"                TIMESTAMP     NOT NULL,
        "description"            text,
        "metadata"               jsonb,
        "createdAt"              TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_invoices_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscription_invoices_subscription"
          FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE
      )
    `);

    // ── subscription_events ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscription_events" (
        "id"             uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "userId"         uuid      NOT NULL,
        "subscriptionId" uuid      NOT NULL,
        "eventType"      "public"."subscription_event_type_enum" NOT NULL,
        "payload"        jsonb,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_events_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscription_events_subscription"
          FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE
      )
    `);

    // ── INDEXES ────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_methods_userId"      ON "payment_methods"      ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_userId"   ON "user_subscriptions"   ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_status"   ON "user_subscriptions"   ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_nextBill" ON "user_subscriptions"   ("nextBillingDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_invoices_userId" ON "subscription_invoices" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_invoices_subId"  ON "subscription_invoices" ("subscriptionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_events_userId"   ON "subscription_events"   ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_events_subId"    ON "subscription_events"   ("subscriptionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_events_type"     ON "subscription_events"   ("eventType")`,
    );

    // ── ALTER users ────────────────────────────────────────────────────────
    // stripeSubscriptionId is now tracked in user_subscriptions
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "stripeSubscriptionId"
    `);

    // ── SEED default plans ─────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "subscription_plans"
        ("name", "slug", "price", "currency", "billingCycle", "trialDays", "features", "isActive")
      VALUES
        (
          'Free', 'free', 0, 'usd', NULL, 0,
          '["Access to free lessons","Basic quiz","Track progress"]',
          true
        ),
        (
          'Premium Monthly', 'premium_monthly', 9.99, 'usd', 'monthly', 7,
          '["All free features","Unlimited premium lessons","Advanced quizzes","Priority support","Download lessons"]',
          true
        ),
        (
          'Premium Yearly', 'premium_yearly', 99.99, 'usd', 'yearly', 7,
          '["All free features","Unlimited premium lessons","Advanced quizzes","Priority support","Download lessons","2 months free"]',
          true
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore column
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" character varying
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_events_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_events_subId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_events_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_invoices_subId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_invoices_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_nextBill"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_methods_userId"`);

    // Drop tables (order matters — child first)
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_methods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscription_event_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoice_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_method_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."billing_cycle_enum"`);
  }
}
