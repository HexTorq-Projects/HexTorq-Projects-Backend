import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const schema = z.object({ categoryName: z.string().min(1).max(200) });

router.get("/", async (_req, res) => {
  const items = await prisma.category.findMany({ orderBy: { categoryName: "asc" } });
  res.json({ items });
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const category = await prisma.category.create({
    data: { ...parsed.data, rowCreatedUser: "admin", rowUpdatedUser: "admin" },
  });
  res.status(201).json(category);
});

router.patch("/:id", async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.category.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Category not found" });

  const category = await prisma.category.update({
    where: { id: String(req.params.id) },
    data: { ...parsed.data, rowUpdatedUser: "admin" },
  });
  res.json(category);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Category not found" });

  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "Cannot delete a category that still has sub-categories or projects" });
  }
});

export default router;
