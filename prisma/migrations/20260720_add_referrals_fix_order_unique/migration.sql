-- Manual migration: add referral system tables, and fix an accidental
-- UNIQUE constraint on order.user_id that was added to schema.prisma without
-- ever shipping a migration for it. Left in place it would limit every user
-- to exactly one order for their entire account lifetime, and (since the
-- referral_code column below was also never migrated) checkout was crashing
-- outright with an unhandled DB error -> 502 for every checkout attempt.

-- Defensive: drop the unique constraint/index on order.user_id if it exists
-- under Prisma's default naming, in case it was ever applied out-of-band
-- (e.g. via `prisma db push` against production).
ALTER TABLE "order" DROP CONSTRAINT IF EXISTS "order_user_id_key";
DROP INDEX IF EXISTS "order_user_id_key";

-- 1. Order: referral attribution column
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;

-- 2. Referral code (one per user)
CREATE TABLE IF NOT EXISTS "referral_code" (
    "referral_code_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "row_created_user" TEXT NOT NULL DEFAULT 'system',
    "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_updated_user" TEXT NOT NULL DEFAULT 'system',
    "row_updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_code_pkey" PRIMARY KEY ("referral_code_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_key" ON "referral_code"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_user_id_key" ON "referral_code"("user_id");
ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Referral earning (one per successful referred purchase)
CREATE TABLE IF NOT EXISTS "referral_earning" (
    "referral_earning_id" TEXT NOT NULL,
    "referral_code_id" TEXT NOT NULL,
    "referred_name" TEXT NOT NULL,
    "referred_email" TEXT NOT NULL,
    "project_title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "row_created_user" TEXT NOT NULL DEFAULT 'system',
    "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_updated_user" TEXT NOT NULL DEFAULT 'system',
    "row_updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_earning_pkey" PRIMARY KEY ("referral_earning_id")
);
CREATE INDEX IF NOT EXISTS "referral_earning_referral_code_id_idx" ON "referral_earning"("referral_code_id");
ALTER TABLE "referral_earning" ADD CONSTRAINT "referral_earning_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_code"("referral_code_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Referral withdrawal requests
CREATE TABLE IF NOT EXISTS "referral_withdrawal" (
    "referral_withdrawal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "upi_id" TEXT NOT NULL,
    "upi_holder_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "row_created_user" TEXT NOT NULL DEFAULT 'system',
    "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_updated_user" TEXT NOT NULL DEFAULT 'system',
    "row_updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_withdrawal_pkey" PRIMARY KEY ("referral_withdrawal_id")
);
CREATE INDEX IF NOT EXISTS "referral_withdrawal_user_id_idx" ON "referral_withdrawal"("user_id");
CREATE INDEX IF NOT EXISTS "referral_withdrawal_status_idx" ON "referral_withdrawal"("status");
ALTER TABLE "referral_withdrawal" ADD CONSTRAINT "referral_withdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
