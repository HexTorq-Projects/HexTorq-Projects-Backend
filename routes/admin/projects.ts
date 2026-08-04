import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const PER_PAGE = 20;

const projectSchema = z.object({
  projectTitle: z.string().min(1, "Title is required").max(300),
  brief: z.string().optional().default(""),
  detailed: z.string().optional().default(""),
  importanceScore: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val !== undefined && val !== null && !isNaN(Number(val)) ? Math.round(Number(val)) : 50)),
  scoreBand: z.string().optional().default("Medium"),
  sellabilityTier: z.string().max(60).nullable().optional(),
  complexity: z.string().max(60).nullable().optional(),
  recommendedPrice: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) ? Math.round(Number(val)) : null)),
  discountedPrice: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) ? Math.round(Number(val)) : null)),
  originalPrice: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => (val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) ? Math.round(Number(val)) : null)),
  suggestedTech: z.string().nullable().optional(),
  suggestedModules: z.string().nullable().optional(),
  categoryId: z.string().uuid("Please select a valid Category"),
  subCategoryId: z.string().uuid().nullable().optional(),
  applicationAreaId: z.string().uuid().nullable().optional(),
});

const updateProjectSchema = projectSchema.partial();

const projectInclude = { category: true, subCategory: true, applicationArea: true };

// GET /admin/projects
router.get("/", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page ?? 1));

  const where: Record<string, unknown> = {};
  if (q.category) where.categoryId = q.category;
  if (q.search) {
    const contains = { contains: q.search, mode: "insensitive" as const };
    where.OR = [{ projectTitle: contains }, { brief: contains }];
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      orderBy: { rowCreatedTime: "desc" },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ items, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) });
});

// GET /admin/projects/:id
router.get("/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: String(req.params.id) },
    include: projectInclude,
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

// POST /admin/projects
router.post("/", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const data = parsed.data;
  const brief = data.brief.trim() || data.projectTitle;
  const detailed = data.detailed.trim() || brief;
  const scoreBand = data.scoreBand.trim() || "Medium";

  const project = await prisma.project.create({
    data: {
      ...data,
      brief,
      detailed,
      scoreBand,
      rowCreatedUser: "admin",
      rowUpdatedUser: "admin",
    },
    include: projectInclude,
  });
  res.status(201).json(project);
});

// PATCH /admin/projects/:id
router.patch("/:id", async (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.project.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Project not found" });

  const project = await prisma.project.update({
    where: { id: String(req.params.id) },
    data: { ...parsed.data, rowUpdatedUser: "admin" },
    include: projectInclude,
  });
  res.json(project);
});

// DELETE /admin/projects/:id
router.delete("/:id", async (req, res) => {
  const existing = await prisma.project.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Project not found" });

  try {
    await prisma.project.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: "Cannot delete a project referenced by orders, wishlist, enquiries, or offers" });
  }
});

export default router;
