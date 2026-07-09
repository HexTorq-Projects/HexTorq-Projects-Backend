import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth); // every wishlist route requires a logged-in user

const addSchema = z.object({ projectId: z.string().uuid() });

// GET /wishlist -> the user's saved projects (full project + relations)
router.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      project: { include: { category: true, subCategory: true, applicationArea: true } },
    },
    orderBy: { rowCreatedTime: "desc" },
  });
  res.json(items.map((w) => w.project));
});

// POST /wishlist { projectId } -> idempotent add
router.post("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { projectId } = parsed.data;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return res.status(400).json({ error: "Unknown projectId" });

  await prisma.wishlist.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId, rowCreatedUser: userId, rowUpdatedUser: userId },
    update: {},
  });
  res.status(201).json({ projectId, saved: true });
});

// DELETE /wishlist/:projectId -> idempotent remove
router.delete("/:projectId", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const projectId = String(req.params.projectId);
  await prisma.wishlist.deleteMany({ where: { userId, projectId } });
  res.status(204).end();
});

export default router;
