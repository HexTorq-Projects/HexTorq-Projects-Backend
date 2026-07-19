import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const schema = z.object({
  subCategoryName: z.string().min(1).max(200),
  categoryId: z.string().uuid(),
});

router.get("/", async (_req, res) => {
  const items = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: { subCategoryName: "asc" },
  });
  res.json({ items });
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const subCategory = await prisma.subCategory.create({
    data: { ...parsed.data, rowCreatedUser: "admin", rowUpdatedUser: "admin" },
    include: { category: true },
  });
  res.status(201).json(subCategory);
});

router.patch("/:id", async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.subCategory.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Sub-category not found" });

  const subCategory = await prisma.subCategory.update({
    where: { id: String(req.params.id) },
    data: { ...parsed.data, rowUpdatedUser: "admin" },
    include: { category: true },
  });
  res.json(subCategory);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.subCategory.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Sub-category not found" });

  try {
    await prisma.subCategory.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "Cannot delete a sub-category that still has projects" });
  }
});

export default router;
