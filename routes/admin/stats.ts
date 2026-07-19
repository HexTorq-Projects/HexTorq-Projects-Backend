import { Router } from "express";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();
router.use(requireAdmin);

// GET /admin/stats
router.get("/", async (_req, res) => {
  const now = new Date();
  const [userCount, projectCount, orderStatusGroups, paidOrders, activeOfferCount, enquiryCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
      prisma.offer.count({ where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } } }),
      prisma.enquiry.count({ where: { status: "NEW" } }),
    ]);

  res.json({
    userCount,
    projectCount,
    orderStatusCounts: Object.fromEntries(orderStatusGroups.map((g) => [g.status, g._count._all])),
    totalRevenue: paidOrders._sum.totalAmount ?? 0,
    activeOfferCount,
    newEnquiryCount: enquiryCount,
  });
});

export default router;
