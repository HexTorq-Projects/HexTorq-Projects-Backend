import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const PER_PAGE = 20;

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  googleId: true,
  rowCreatedTime: true,
  _count: { select: { orders: true, wishlist: true, enquiries: true } },
} as const;

const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).nullable().optional(),
});

// GET /admin/users
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      orderBy: { rowCreatedTime: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) });
});

// GET /admin/users/:id
router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    select: userSelect,
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// PATCH /admin/users/:id
router.patch("/:id", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "User not found" });

  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { ...parsed.data, rowUpdatedUser: "admin" },
    select: userSelect,
  });
  res.json(user);
});

// DELETE /admin/users/:id
router.delete("/:id", async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "User not found" });

  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "Cannot delete a user with existing orders, wishlist, or enquiries" });
  }
});

export default router;
