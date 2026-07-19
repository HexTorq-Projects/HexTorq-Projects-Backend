import prisma from "./prisma";

export type ActiveOffer = Awaited<ReturnType<typeof getActiveOffers>>[number];

export async function getActiveOffers() {
  const now = new Date();
  return prisma.offer.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { projects: { select: { projectId: true } } },
  });
}

export function bestOffer(
  project: { id: string; categoryId: string; subCategoryId: string | null },
  offers: ActiveOffer[]
): ActiveOffer | null {
  let best: ActiveOffer | null = null;
  for (const offer of offers) {
    const matches =
      offer.scopeType === "ALL" ||
      (offer.scopeType === "CATEGORY" && offer.categoryId === project.categoryId) ||
      (offer.scopeType === "SUBCATEGORY" && offer.subCategoryId === project.subCategoryId) ||
      (offer.scopeType === "PROJECT" && offer.projects.some((p) => p.projectId === project.id));
    if (matches && (!best || offer.discountPercent > best.discountPercent)) best = offer;
  }
  return best;
}

export function effectivePrice(
  project: { recommendedPrice: number | null; originalPrice: number | null; discountedPrice: number | null },
  discountPercent: number
): number {
  const base = project.recommendedPrice ?? project.originalPrice ?? project.discountedPrice ?? 0;
  return discountPercent > 0
    ? Math.round(base * (1 - discountPercent / 100))
    : project.discountedPrice ?? base;
}

export function advanceAmountFor(
  price: number,
  offer: { advanceType: string | null; advanceValue: number | null }
): number | null {
  if (!offer.advanceType || offer.advanceValue == null) return null;
  return offer.advanceType === "FIXED"
    ? Math.min(offer.advanceValue, price)
    : Math.round(price * (offer.advanceValue / 100));
}
