-- Manual migration: add Google Sign-In + password reset support to "user"
ALTER TABLE "user" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "user" ADD COLUMN "google_id" TEXT;
ALTER TABLE "user" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "user" ADD COLUMN "reset_token_expires" TIMESTAMP(3);

CREATE UNIQUE INDEX "user_google_id_key" ON "user"("google_id");
