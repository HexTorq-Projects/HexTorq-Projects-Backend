-- Reconcile the two independently-developed password-reset designs after merging
-- origin/main (table-based PasswordResetToken) with this branch (inline User columns).
-- The table-based design won; drop the now-unused inline columns.
ALTER TABLE "user" DROP COLUMN IF EXISTS "reset_token";
ALTER TABLE "user" DROP COLUMN IF EXISTS "reset_token_expires";
