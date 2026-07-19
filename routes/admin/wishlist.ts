import { Router } from "express";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const PER_PAGE = 20;

// GET /admin/wishlist
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));

  const [items, total] = await Promise.all([
    prisma.wishlist.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, projectTitle: true } },
      },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      orderBy: { rowCreatedTime: "desc" },
    }),
    prisma.wishlist.count(),
  ]);

  res.json({ items, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) });
});

// DELETE /admin/wishlist/:id
router.delete("/:id", async (req, res) => {
  const existing = await prisma.wishlist.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Wishlist entry not found" });

  await prisma.wishlist.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

export default router;
