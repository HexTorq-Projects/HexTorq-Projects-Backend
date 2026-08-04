-- Manual migration: track which referral code a user signed up with, so
-- referrers can see their referred signups on the Refer & Earn page.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "referred_by_code" TEXT;
