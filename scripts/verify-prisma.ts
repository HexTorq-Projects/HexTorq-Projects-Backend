import prisma from "../lib/prisma";

async function main() {
  const count = await prisma.category.count();
  console.log(`✅ Connected. Found ${count} categories in the database.`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
