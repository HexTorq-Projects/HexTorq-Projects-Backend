import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

const offerInclude = {
  category: true,
  subCategory: true,
  projects: { include: { project: { select: { id: true, projectTitle: true } } } },
};

const baseSchema = z.object({
  name: z.string().min(1).max(200),
  scopeType: z.enum(["ALL", "CATEGORY", "SUBCATEGORY", "PROJECT"]),
  categoryId: z.string().uuid().nullable().optional(),
  subCategoryId: z.string().uuid().nullable().optional(),
  projectIds: z.array(z.string().uuid()).optional(),
  discountPercent: z.number().int().min(1).max(100),
  advanceType: z.enum(["FIXED", "PERCENT"]).nullable().optional(),
  advanceValue: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
  endsAt: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
  active: z.boolean().optional(),
});

function validateOffer(data: z.infer<typeof baseSchema>) {
  if (new Date(data.endsAt) <= new Date(data.startsAt)) return "endsAt must be after startsAt";
  if (data.scopeType === "CATEGORY" && !data.categoryId) return "categoryId is required for CATEGORY scope";
  if (data.scopeType === "SUBCATEGORY" && !data.subCategoryId) return "subCategoryId is required for SUBCATEGORY scope";
  if (data.scopeType === "PROJECT" && (!data.projectIds || data.projectIds.length === 0))
    return "projectIds is required for PROJECT scope";
  if (data.advanceType && data.advanceValue == null) return "advanceValue is required when advanceType is set";
  if (data.advanceType === "PERCENT" && data.advanceValue != null && data.advanceValue > 100)
    return "advanceValue must be at most 100 when advanceType is PERCENT";
  return null;
}

// GET /admin/offers
router.get("/", async (_req, res) => {
  const items = await prisma.offer.findMany({
    include: offerInclude,
    orderBy: { rowCreatedTime: "desc" },
  });
  res.json({ items });
});

// GET /admin/offers/:id
router.get("/:id", async (req, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: String(req.params.id) },
    include: offerInclude,
  });
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  res.json(offer);
});

// POST /admin/offers
router.post("/", async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const validationError = validateOffer(parsed.data);
  if (validationError) return res.status(400).json({ error: validationError });

  const { projectIds, ...rest } = parsed.data;
  const offer = await prisma.offer.create({
    data: {
      ...rest,
      categoryId: rest.scopeType === "CATEGORY" ? rest.categoryId : null,
      subCategoryId: rest.scopeType === "SUBCATEGORY" ? rest.subCategoryId : null,
      startsAt: new Date(rest.startsAt),
      endsAt: new Date(rest.endsAt),
      rowCreatedUser: "admin",
      rowUpdatedUser: "admin",
      projects:
        rest.scopeType === "PROJECT" && projectIds
          ? { create: projectIds.map((projectId) => ({ projectId })) }
          : undefined,
    },
    include: offerInclude,
  });
  res.status(201).json(offer);
});

// PATCH /admin/offers/:id
router.patch("/:id", async (req, res) => {
  const parsed = baseSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.offer.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Offer not found" });

  const effectiveScope = parsed.data.scopeType ?? existing.scopeType;
  const effectiveStartsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : existing.startsAt;
  const effectiveEndsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : existing.endsAt;

  const validationError = validateOffer({
    name: parsed.data.name ?? existing.name,
    scopeType: effectiveScope as "ALL" | "CATEGORY" | "SUBCATEGORY" | "PROJECT",
    categoryId: parsed.data.categoryId !== undefined ? parsed.data.categoryId : existing.categoryId,
    subCategoryId: parsed.data.subCategoryId !== undefined ? parsed.data.subCategoryId : existing.subCategoryId,
    projectIds: parsed.data.projectIds,
    discountPercent: parsed.data.discountPercent ?? existing.discountPercent,
    advanceType: parsed.data.advanceType !== undefined ? parsed.data.advanceType : (existing.advanceType as "FIXED" | "PERCENT" | null),
    advanceValue: parsed.data.advanceValue !== undefined ? parsed.data.advanceValue : existing.advanceValue,
    startsAt: effectiveStartsAt.toISOString(),
    endsAt: effectiveEndsAt.toISOString(),
  });
  if (validationError) return res.status(400).json({ error: validationError });

  const { projectIds, startsAt, endsAt, ...rest } = parsed.data;

  const offer = await prisma.$transaction(async (tx) => {
    if (projectIds) {
      await tx.offerProject.deleteMany({ where: { offerId: String(req.params.id) } });
      if (effectiveScope === "PROJECT" && projectIds.length > 0) {
        await tx.offerProject.createMany({
          data: projectIds.map((projectId) => ({ offerId: String(req.params.id), projectId })),
        });
      }
    }

    return tx.offer.update({
      where: { id: String(req.params.id) },
      data: {
        ...rest,
        categoryId: effectiveScope === "CATEGORY" ? rest.categoryId ?? existing.categoryId : null,
        subCategoryId: effectiveScope === "SUBCATEGORY" ? rest.subCategoryId ?? existing.subCategoryId : null,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        rowUpdatedUser: "admin",
      },
      include: offerInclude,
    });
  });

  res.json(offer);
});

// DELETE /admin/offers/:id
router.delete("/:id", async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Offer not found" });

  await prisma.offer.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

export default router;
