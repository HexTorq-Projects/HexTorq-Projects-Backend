import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

const TTL = 5 * 60 * 1000; // 5 minutes
let cache: { data: unknown; ts: number } | null = null;

// GET /stats -> landing-band numbers, cached in-module for 5 minutes
router.get("/", async (_req, res) => {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return res.json(cache.data);

  const [totalProjects, categories, applicationAreas, tierGroups, priceAgg] =
    await Promise.all([
      prisma.project.count(),
      prisma.category.count(),
      prisma.applicationArea.count(),
      prisma.project.groupBy({ by: ["sellabilityTier"], _count: { _all: true } }),
      prisma.project.aggregate({
        _min: { recommendedPrice: true },
        _max: { recommendedPrice: true },
        _avg: { recommendedPrice: true },
      }),
    ]);

  const tiers: Record<string, number> = {};
  for (const g of tierGroups) tiers[g.sellabilityTier ?? "Unknown"] = g._count._all;

  const data = {
    totalProjects,
    categories,
    applicationAreas,
    premiumCount: tiers["Premium"] ?? 0,
    tiers,
    priceRange: {
      min: priceAgg._min.recommendedPrice ?? 0,
      max: priceAgg._max.recommendedPrice ?? 0,
      avg: Math.round(priceAgg._avg.recommendedPrice ?? 0),
    },
  };
  cache = { data, ts: now };
  res.json(data);
});

export default router;
