-- Manual migration: add pre-booking / advance-payment support

-- 1. Offer: advance option
ALTER TABLE "offer" ADD COLUMN "advance_type" TEXT;
ALTER TABLE "offer" ADD COLUMN "advance_value" INTEGER;

-- 2. Order: payment rollup columns
ALTER TABLE "order" ADD COLUMN "payment_type" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "order" ADD COLUMN "amount_paid" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order" ADD COLUMN "balance_due" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing orders: fully counted if already PAID, otherwise nothing paid yet
UPDATE "order" SET "amount_paid" = "total_amount", "balance_due" = 0 WHERE "status" = 'PAID';
UPDATE "order" SET "amount_paid" = 0, "balance_due" = "total_amount" WHERE "status" != 'PAID';

-- 3. OrderPayment: one row per payment attempt
CREATE TABLE "order_payment" (
    "order_payment_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "external_order_id" TEXT NOT NULL,
    "pay_panda_payment_id" TEXT,
    "checkout_url" TEXT,
    "bank_rrn" TEXT,
    "paid_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "verification_code" TEXT,
    "verification_message" TEXT,
    "row_created_user" TEXT NOT NULL DEFAULT 'system',
    "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_updated_user" TEXT NOT NULL DEFAULT 'system',
    "row_updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payment_pkey" PRIMARY KEY ("order_payment_id")
);

CREATE UNIQUE INDEX "order_payment_external_order_id_key" ON "order_payment"("external_order_id");
CREATE INDEX "order_payment_order_id_idx" ON "order_payment"("order_id");
CREATE INDEX "order_payment_pay_panda_payment_id_idx" ON "order_payment"("pay_panda_payment_id");

ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one FULL OrderPayment row per existing order, from its own payment fields
INSERT INTO "order_payment" (
    "order_payment_id", "order_id", "purpose", "amount", "status", "external_order_id",
    "pay_panda_payment_id", "checkout_url", "bank_rrn", "paid_at", "expires_at",
    "verification_code", "verification_message",
    "row_created_user", "row_created_time", "row_updated_user", "row_updated_time"
)
SELECT
    gen_random_uuid()::text,
    "order_id",
    'FULL',
    "total_amount",
    CASE
        WHEN "status" = 'PAID' THEN 'SUCCESS'
        WHEN "status" IN ('FAILED', 'EXPIRED') THEN "status"
        ELSE 'PENDING'
    END,
    "order_number",
    "pay_panda_payment_id",
    "checkout_url",
    "bank_rrn",
    "paid_at",
    "expires_at",
    "verification_code",
    "verification_message",
    "row_created_user",
    "row_created_time",
    "row_updated_user",
    "row_updated_time"
FROM "order";
