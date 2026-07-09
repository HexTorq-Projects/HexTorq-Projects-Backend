import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();
const PER_PAGE = 20;

// GET /projects  (existing params preserved + new optional filters)
//   category, subCategory, applicationArea, tier, complexity,
//   minPrice, maxPrice (on recommendedPrice), search (title+brief+detailed),
//   sort = importance | price_asc | price_desc | newest, page
router.get("/", async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page ?? 1));

  const where: Record<string, unknown> = {};
  if (q.category) where.category = { categoryName: q.category };
  if (q.subCategory) where.subCategory = { subCategoryName: q.subCategory };
  if (q.applicationArea) where.applicationArea = { applicationAreaName: q.applicationArea };
  if (q.tier) where.sellabilityTier = q.tier;
  if (q.complexity) where.complexity = q.complexity;

  const minP = Number(req.query.minPrice);
  const maxP = Number(req.query.maxPrice);
  const hasMin = req.query.minPrice != null && Number.isFinite(minP);
  const hasMax = req.query.maxPrice != null && Number.isFinite(maxP);
  if (hasMin || hasMax) {
    const priceFilter: { gte?: number; lte?: number } = {};
    if (hasMin) priceFilter.gte = minP;
    if (hasMax) priceFilter.lte = maxP;
    where.recommendedPrice = priceFilter;
  }

  if (q.search) {
    const contains = { contains: q.search, mode: "insensitive" as const };
    where.OR = [
      { projectTitle: contains },
      { brief: contains },
      { detailed: contains },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    q.sort === "price_asc"
      ? { recommendedPrice: "asc" }
      : q.sort === "price_desc"
      ? { recommendedPrice: "desc" }
      : q.sort === "newest"
      ? { rowCreatedTime: "desc" }
      : { importanceScore: "desc" };

  const limit = req.query.perPage ? Math.min(10000, Number(req.query.perPage)) : PER_PAGE;

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { category: true, subCategory: true, applicationArea: true },
      take: limit,
      skip: (page - 1) * limit,
      orderBy,
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ items, total, page, perPage: limit, pages: Math.ceil(total / limit) });
});

// GET /projects/:id  (unchanged)
router.get("/:id", async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: String(req.params.id) },
    include: { category: true, subCategory: true, applicationArea: true },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

export default router;
