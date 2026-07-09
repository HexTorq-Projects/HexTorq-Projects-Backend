-- Manual migration: rename columns to snake_case
-- Category table
ALTER TABLE "category" RENAME COLUMN "id" TO "category_id";
ALTER TABLE "category" RENAME COLUMN "categoryName" TO "category_name";
ALTER TABLE "category" RENAME COLUMN "rowCreatedUser" TO "row_created_user";
ALTER TABLE "category" RENAME COLUMN "rowCreatedTime" TO "row_created_time";
ALTER TABLE "category" RENAME COLUMN "rowUpdatedUser" TO "row_updated_user";
ALTER TABLE "category" RENAME COLUMN "rowUpdatedTime" TO "row_updated_time";

-- SubCategory table
ALTER TABLE "sub_category" RENAME COLUMN "id" TO "sub_category_id";
ALTER TABLE "sub_category" RENAME COLUMN "subCategoryName" TO "sub_category_name";
ALTER TABLE "sub_category" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "sub_category" RENAME COLUMN "rowCreatedUser" TO "row_created_user";
ALTER TABLE "sub_category" RENAME COLUMN "rowCreatedTime" TO "row_created_time";
ALTER TABLE "sub_category" RENAME COLUMN "rowUpdatedUser" TO "row_updated_user";
ALTER TABLE "sub_category" RENAME COLUMN "rowUpdatedTime" TO "row_updated_time";

-- ApplicationArea table
ALTER TABLE "application_area" RENAME COLUMN "id" TO "application_area_id";
ALTER TABLE "application_area" RENAME COLUMN "applicationAreaName" TO "application_area_name";
ALTER TABLE "application_area" RENAME COLUMN "rowCreatedUser" TO "row_created_user";
ALTER TABLE "application_area" RENAME COLUMN "rowCreatedTime" TO "row_created_time";
ALTER TABLE "application_area" RENAME COLUMN "rowUpdatedUser" TO "row_updated_user";
ALTER TABLE "application_area" RENAME COLUMN "rowUpdatedTime" TO "row_updated_time";

ALTER TABLE "project" RENAME COLUMN "projectTitle" TO "project_title";
ALTER TABLE "project" RENAME COLUMN "importanceScore" TO "importance_score";
ALTER TABLE "project" RENAME COLUMN "scoreBand" TO "score_band";
ALTER TABLE "project" RENAME COLUMN "sellabilityTier" TO "sellability_tier";
ALTER TABLE "project" RENAME COLUMN "recommendedPrice" TO "recommended_price";
ALTER TABLE "project" RENAME COLUMN "discountedPrice" TO "discounted_price";
ALTER TABLE "project" RENAME COLUMN "originalPrice" TO "original_price";
ALTER TABLE "project" RENAME COLUMN "suggestedTech" TO "suggested_tech";
ALTER TABLE "project" RENAME COLUMN "suggestedModules" TO "suggested_modules";
ALTER TABLE "project" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "project" RENAME COLUMN "subCategoryId" TO "sub_category_id";
ALTER TABLE "project" RENAME COLUMN "applicationAreaId" TO "application_area_id";
ALTER TABLE "project" RENAME COLUMN "rowCreatedUser" TO "row_created_user";
ALTER TABLE "project" RENAME COLUMN "rowCreatedTime" TO "row_created_time";
ALTER TABLE "project" RENAME COLUMN "rowUpdatedUser" TO "row_updated_user";
ALTER TABLE "project" RENAME COLUMN "rowUpdatedTime" TO "row_updated_time";

