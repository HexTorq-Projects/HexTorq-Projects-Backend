import XLSX from "xlsx";
import prisma from "./lib/prisma";

const IMPORT_USER = "excel-import";
const str = (v: unknown) =>
  v === "" || v == null ? null : String(v).trim();
const num = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.round(x) : null;
};

const pick = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys)
    if (row[k] !== undefined && row[k] !== "") return row[k];
  return null;
};

async function main() {
  const wb = XLSX.readFile("projects.xlsx");
  const rows = XLSX.utils.sheet_to_json<
    Record<string, unknown>
  >(wb.Sheets["All_Reordered"]);
  console.log(`Found ${rows.length} rows`);

  type Parsed = {
    title: string;
    brief: string;
    detailed: string;
    importanceScore: number;
    scoreBand: string;
    sellabilityTier: string | null;
    complexity: string | null;
    recommendedPrice: number | null;
    discountedPrice: number | null;
    originalPrice: number | null;
    suggestedTech: string | null;
    suggestedModules: string | null;
    categoryName: string;
    subName: string | null;
    areaName: string | null;
  };

  const parsed: Parsed[] = [];

  for (const r of rows) {
    const title = str(pick(r, "Clean Project Title"));
    if (!title) continue;

    parsed.push({
      title,
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
      categoryName: str(pick(r, "Category ", "Category", "Primary Group")) || "Uncategorized",
      subName: str(pick(r, "Sub category ", "Sub category", "Detailed Group")),
      areaName: str(pick(r, "Application Area")),
    });
  }

  console.log(`Parsed ${parsed.length} valid rows`);

  // ---- 1. Categories ----
  const uniqueCategories = [...new Set(parsed.map((p) => p.categoryName))];
  const existingCategories = await prisma.category.findMany({
    where: { categoryName: { in: uniqueCategories } },
  });
  const existingCatNames = new Set(
    existingCategories.map((c) => c.categoryName)
  );
  const newCategories = uniqueCategories.filter(
    (n) => !existingCatNames.has(n)
  );

  if (newCategories.length > 0) {
    await prisma.category.createMany({
      data: newCategories.map((name) => ({
        categoryName: name,
        rowCreatedUser: IMPORT_USER,
        rowUpdatedUser: IMPORT_USER,
      })),
    });
  }

  const allCategories = await prisma.category.findMany({
    where: { categoryName: { in: uniqueCategories } },
  });
  const categoryMap = new Map(
    allCategories.map((c) => [c.categoryName, c.id])
  );
  console.log(`Categories: ${allCategories.length}`);

  // ---- 2. SubCategories ----
  const uniqueSubs = [
    ...new Set(parsed.filter((p) => p.subName).map((p) => p.subName!)),
  ];
  const existingSubs = await prisma.subCategory.findMany({
    where: { subCategoryName: { in: uniqueSubs } },
  });
  const existingSubNames = new Set(
    existingSubs.map((s) => s.subCategoryName)
  );
  const newSubs = uniqueSubs.filter((n) => !existingSubNames.has(n));

  if (newSubs.length > 0) {
    const subData = newSubs.map((name) => {
      const parent = parsed.find(
        (p) => p.subName === name
      )!;
      return {
        subCategoryName: name,
        categoryId: categoryMap.get(parent.categoryName)!,
        rowCreatedUser: IMPORT_USER,
        rowUpdatedUser: IMPORT_USER,
      };
    });
    await prisma.subCategory.createMany({ data: subData });
  }

  const allSubs = await prisma.subCategory.findMany({
    where: { subCategoryName: { in: uniqueSubs } },
  });
  const subMap = new Map(
    allSubs.map((s) => [s.subCategoryName, s.id])
  );
  console.log(`SubCategories: ${allSubs.length}`);

  // ---- 3. ApplicationAreas ----
  const uniqueAreas = [
    ...new Set(
      parsed.filter((p) => p.areaName).map((p) => p.areaName!)
    ),
  ];
  const existingAreas = await prisma.applicationArea.findMany({
    where: { applicationAreaName: { in: uniqueAreas } },
  });
  const existingAreaNames = new Set(
    existingAreas.map((a) => a.applicationAreaName)
  );
  const newAreas = uniqueAreas.filter(
    (n) => !existingAreaNames.has(n)
  );

  if (newAreas.length > 0) {
    await prisma.applicationArea.createMany({
      data: newAreas.map((name) => ({
        applicationAreaName: name,
        rowCreatedUser: IMPORT_USER,
        rowUpdatedUser: IMPORT_USER,
      })),
    });
  }

  const allAreas = await prisma.applicationArea.findMany({
    where: { applicationAreaName: { in: uniqueAreas } },
  });
  const areaMap = new Map(
    allAreas.map((a) => [a.applicationAreaName, a.id])
  );
  console.log(`ApplicationAreas: ${allAreas.length}`);

  // ---- 4. Projects in batches ----
  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    const batch = parsed.slice(i, i + BATCH_SIZE);
    await prisma.project.createMany({
      data: batch.map((p) => ({
        projectTitle: p.title,
        brief: p.brief,
        detailed: p.detailed,
        importanceScore: p.importanceScore,
        scoreBand: p.scoreBand,
        sellabilityTier: p.sellabilityTier,
        complexity: p.complexity,
        recommendedPrice: p.recommendedPrice,
        discountedPrice: p.discountedPrice,
        originalPrice: p.originalPrice,
        suggestedTech: p.suggestedTech,
        suggestedModules: p.suggestedModules,
        categoryId: categoryMap.get(p.categoryName)!,
        subCategoryId: p.subName ? subMap.get(p.subName) ?? null : null,
        applicationAreaId: p.areaName
          ? areaMap.get(p.areaName) ?? null
          : null,
        rowCreatedUser: IMPORT_USER,
        rowUpdatedUser: IMPORT_USER,
      })),
    });
    imported += batch.length;
    console.log(`  ... ${imported} / ${parsed.length} projects`);
  }

  console.log(`Imported ${imported} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
