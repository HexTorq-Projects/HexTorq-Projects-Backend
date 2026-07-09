import prisma from "../lib/prisma";

async function main() {
  const catCount = await prisma.category.count();
  const subCount = await prisma.subCategory.count();
  const areaCount = await prisma.applicationArea.count();
  const projCount = await prisma.project.count();
  console.log("Categories:", catCount);
  console.log("SubCategories:", subCount);
  console.log("ApplicationAreas:", areaCount);
  console.log("Projects:", projCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
