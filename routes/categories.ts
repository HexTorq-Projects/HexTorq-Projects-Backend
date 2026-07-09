import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /categories  (unchanged response shape)
router.get("/", async (_req, res) => {
  const cats = await prisma.category.findMany({
    include: {
      _count: { select: { projects: true } },
      subCategories: {
        include: { _count: { select: { projects: true } } },
        orderBy: { subCategoryName: "asc" },
      },
    },
    orderBy: { categoryName: "asc" },
  });
  res.json(
    cats.map((c) => ({
      id: c.id,
      name: c.categoryName,
      count: c._count.projects,
      subCategories: c.subCategories.map((s) => ({
        id: s.id,
        name: s.subCategoryName,
        count: s._count.projects,
      })),
    }))
  );
});

export default router;
