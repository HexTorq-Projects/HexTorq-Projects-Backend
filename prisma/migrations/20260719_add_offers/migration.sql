-- Manual migration: add discount-campaign ("offer") support
CREATE TABLE "offer" (
    "offer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "category_id" TEXT,
    "sub_category_id" TEXT,
    "discount_percent" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "row_created_user" TEXT NOT NULL DEFAULT 'system',
    "row_created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_updated_user" TEXT NOT NULL DEFAULT 'system',
    "row_updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("offer_id")
);

CREATE TABLE "offer_project" (
    "offer_project_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "offer_project_pkey" PRIMARY KEY ("offer_project_id")
);

CREATE INDEX "offer_scope_type_idx" ON "offer"("scope_type");
CREATE INDEX "offer_active_idx" ON "offer"("active");
CREATE INDEX "offer_starts_at_idx" ON "offer"("starts_at");
CREATE INDEX "offer_ends_at_idx" ON "offer"("ends_at");

CREATE UNIQUE INDEX "offer_project_offer_id_project_id_key" ON "offer_project"("offer_id", "project_id");
CREATE INDEX "offer_project_project_id_idx" ON "offer_project"("project_id");

ALTER TABLE "offer" ADD CONSTRAINT "offer_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer" ADD CONSTRAINT "offer_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category"("sub_category_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_project" ADD CONSTRAINT "offer_project_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offer"("offer_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_project" ADD CONSTRAINT "offer_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE;
