// Imports the Excel "All_Reordered" sheet into the 4 tables.
// Run once after `npx prisma migrate dev`.  Command: node import.js
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMPORT_USER = "excel-import";       // who created these rows (audit)
const str = (v) => (v === "" || v == null ? null : String(v).trim());
const num = (v) => { const x = Number(v); return Number.isFinite(x) ? Math.round(x) : null; };

// pick the first matching header (your sheet uses slightly different names)
const pick = (row, ...keys) => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k];
  return null;
};

async function main() {
  const wb = XLSX.readFile("projects.xlsx");
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["All_Reordered"]);
  console.log(`Found ${rows.length} rows`);

  let n = 0;
  for (const r of rows) {
    const title = str(pick(r, "Clean Project Title"));
    if (!title) continue;

    const categoryName = str(pick(r, "Category ", "Category", "Primary Group")) || "Uncategorized";
    const subName      = str(pick(r, "Sub category ", "Sub category", "Detailed Group"));
    const areaName     = str(pick(r, "Application Area"));

    // 1) category (create if new)
    const category = await prisma.category.upsert({
      where: { categoryName },
      update: {},
      create: { categoryName, rowCreatedUser: IMPORT_USER, rowUpdatedUser: IMPORT_USER },
    });

    // 2) sub-category (linked to category)
    let subCategoryId = null;
    if (subName) {
      const sub = await prisma.subCategory.upsert({
        where: { subCategoryName: subName },
        update: {},
        create: {
          subCategoryName: subName, categoryId: category.id,
          rowCreatedUser: IMPORT_USER, rowUpdatedUser: IMPORT_USER,
        },
      });
      subCategoryId = sub.id;
    }

    // 3) application area
    let applicationAreaId = null;
    if (areaName) {
      const area = await prisma.applicationArea.upsert({
        where: { applicationAreaName: areaName },
        update: {},
        create: {
          applicationAreaName: areaName,
          rowCreatedUser: IMPORT_USER, rowUpdatedUser: IMPORT_USER,
        },
      });
      applicationAreaId = area.id;
    }

    // 4) project
    await prisma.project.create({
      data: {
        projectTitle: title,
        brief: str(pick(r, "Brief Explanation")) ?? "",
        detailed: str(pick(r, "Clean Detailed Explanation")) ?? "",
        importanceScore: num(pick(r, "Importance Score")) ?? 0,
        scoreBand: str(pick(r, "Score Band")) ?? "Medium",
        sellabilityTier: str(pick(r, "Sellability Tier")),
        complexity: str(pick(r, "Complexity")),
        recommendedPrice: num(pick(r, "Recommended Price")),
        discountedPrice: num(pick(r, "Discounted Price", "Minimum Price")),
        originalPrice: num(pick(r, "original Price", "Original Price", "Maximum Price")),
        suggestedTech: str(pick(r, "Suggested Tech Stack")),
        suggestedModules: str(pick(r, "Suggested Modules")),
        categoryId: category.id,
        subCategoryId,
        applicationAreaId,
        rowCreatedUser: IMPORT_USER,
        rowUpdatedUser: IMPORT_USER,
      },
    });
    n++;
  }
  console.log(`Imported ${n} projects.`);
}
main().catch((e)=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
