import prisma from "../lib/prisma";

async function main() {
  const first = await prisma.project.findFirst({
    select: { id: true, projectTitle: true },
  });
  console.log('First project:', first);
}

main().catch(console.error).finally(() => prisma.$disconnect());
