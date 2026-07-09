import prisma from "../lib/prisma";

async function main() {
  const category = await prisma.category.upsert({
    where: { categoryName: "Web Development" },
    update: {},
    create: { categoryName: "Web Development" },
  });

  const subCategory = await prisma.subCategory.upsert({
    where: { subCategoryName: "Full Stack" },
    update: {},
    create: { subCategoryName: "Full Stack", categoryId: category.id },
  });

  const area = await prisma.applicationArea.upsert({
    where: { applicationAreaName: "Education" },
    update: {},
    create: { applicationAreaName: "Education" },
  });

  await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      projectTitle: "E-Learning Platform",
      brief: "An interactive online learning management system.",
      detailed: "A full-featured LMS supporting courses, quizzes, and progress tracking.",
      importanceScore: 85,
      scoreBand: "High",
      categoryId: category.id,
      subCategoryId: subCategory.id,
      applicationAreaId: area.id,
    },
  });

  console.log("Seeded 1 category, 1 sub-category, 1 application area, 1 project.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
