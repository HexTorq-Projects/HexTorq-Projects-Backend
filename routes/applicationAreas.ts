import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /application-areas -> [{ id, name, count }] ordered by count desc
router.get("/", async (_req, res) => {
  const areas = await prisma.applicationArea.findMany({
    include: { _count: { select: { projects: true } } },
  });
  res.json(
    areas
      .map((a) => ({ id: a.id, name: a.applicationAreaName, count: a._count.projects }))
      .sort((x, y) => y.count - x.count)
  );
});

export default router;
