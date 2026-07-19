CREATE TABLE "order" (
  "order_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
  "total_amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT NOT NULL,
  "customer_mobile" TEXT,
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

  CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

CREATE TABLE "order_item" (
  "order_item_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "project_title_snapshot" TEXT NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "row_created_user" TEXT NOT NULL DEFAULT 'system',
  "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "row_updated_user" TEXT NOT NULL DEFAULT 'system',
  "row_updated_time" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id")
);

CREATE UNIQUE INDEX "order_order_number_key" ON "order"("order_number");
CREATE INDEX "order_user_id_idx" ON "order"("user_id");
CREATE INDEX "order_payment_status_idx" ON "order"("payment_status");
CREATE INDEX "order_pay_panda_payment_id_idx" ON "order"("pay_panda_payment_id");
CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");
CREATE INDEX "order_item_project_id_idx" ON "order_item"("project_id");

ALTER TABLE "order"
  ADD CONSTRAINT "order_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("user_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "order"("order_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "project"("project_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
