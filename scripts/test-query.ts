import prisma from "../lib/prisma";

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, categoryName: true },
  });
  console.log(cats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
