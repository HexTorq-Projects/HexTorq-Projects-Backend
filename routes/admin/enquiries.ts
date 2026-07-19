import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const PER_PAGE = 20;

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
});

// GET /admin/enquiries
router.get("/", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page ?? 1));

  const where: Record<string, unknown> = {};
  if (q.status) where.status = q.status;

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { project: { select: { id: true, projectTitle: true } } },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      orderBy: { rowCreatedTime: "desc" },
    }),
    prisma.enquiry.count({ where }),
  ]);

  res.json({ items, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) });
});

// PATCH /admin/enquiries/:id
router.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.enquiry.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Enquiry not found" });

  const enquiry = await prisma.enquiry.update({
    where: { id: String(req.params.id) },
    data: { status: parsed.data.status, rowUpdatedUser: "admin" },
  });
  res.json(enquiry);
});

// DELETE /admin/enquiries/:id
router.delete("/:id", async (req, res) => {
  const existing = await prisma.enquiry.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Enquiry not found" });

  await prisma.enquiry.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

export default router;
