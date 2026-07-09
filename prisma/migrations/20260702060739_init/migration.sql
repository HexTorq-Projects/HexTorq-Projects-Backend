-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "rowCreatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowCreatedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowUpdatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowUpdatedTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_category" (
    "id" TEXT NOT NULL,
    "subCategoryName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "rowCreatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowCreatedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowUpdatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowUpdatedTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_area" (
    "id" TEXT NOT NULL,
    "applicationAreaName" TEXT NOT NULL,
    "rowCreatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowCreatedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowUpdatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowUpdatedTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "projectTitle" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "detailed" TEXT NOT NULL,
    "importanceScore" INTEGER NOT NULL,
    "scoreBand" TEXT NOT NULL,
    "sellabilityTier" TEXT,
    "complexity" TEXT,
    "recommendedPrice" INTEGER,
    "discountedPrice" INTEGER,
    "originalPrice" INTEGER,
    "suggestedTech" TEXT,
    "suggestedModules" TEXT,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "applicationAreaId" TEXT,
    "rowCreatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowCreatedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowUpdatedUser" TEXT NOT NULL DEFAULT 'system',
    "rowUpdatedTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_categoryName_key" ON "category"("categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "sub_category_subCategoryName_key" ON "sub_category"("subCategoryName");

-- CreateIndex
CREATE INDEX "sub_category_categoryId_idx" ON "sub_category"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "application_area_applicationAreaName_key" ON "application_area"("applicationAreaName");

-- CreateIndex
CREATE INDEX "project_categoryId_idx" ON "project"("categoryId");

-- CreateIndex
CREATE INDEX "project_subCategoryId_idx" ON "project"("subCategoryId");

-- CreateIndex
CREATE INDEX "project_applicationAreaId_idx" ON "project"("applicationAreaId");

-- AddForeignKey
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_applicationAreaId_fkey" FOREIGN KEY ("applicationAreaId") REFERENCES "application_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
