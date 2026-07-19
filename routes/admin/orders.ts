import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";
import { getPayPandaClient } from "../../lib/payPanda";
import { orderInclude, updateOrderFromVerification, findOrderPaymentToVerify } from "../../lib/orderVerification";

const router = Router();
router.use(requireAdmin);

const PER_PAGE = 20;

const updateOrderSchema = z.object({
  status: z.string().min(1).max(40).optional(),
  paymentStatus: z.string().min(1).max(40).optional(),
});

// GET /admin/orders
router.get("/", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page ?? 1));

  const where: Record<string, unknown> = {};
  if (q.status) where.status = q.status;
  if (q.paymentStatus) where.paymentStatus = q.paymentStatus;
  if (q.search) {
    const contains = { contains: q.search, mode: "insensitive" as const };
    where.OR = [{ orderNumber: contains }, { customerName: contains }, { customerEmail: contains }];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { ...orderInclude, user: { select: { id: true, name: true, email: true } } },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      orderBy: { rowCreatedTime: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ items, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) });
});

// GET /admin/orders/:id
router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { ...orderInclude, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// PATCH /admin/orders/:id  (manual status override for support cases)
router.patch("/:id", async (req, res) => {
  const parsed = updateOrderSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const existing = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return res.status(404).json({ error: "Order not found" });

  const order = await prisma.order.update({
    where: { id: String(req.params.id) },
    data: { ...parsed.data, rowUpdatedUser: "admin" },
    include: orderInclude,
  });
  res.json(order);
});

// POST /admin/orders/:id/verify
router.post("/:id/verify", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const orderPayment = await findOrderPaymentToVerify({ orderNumber: order.orderNumber });
  if (!orderPayment || !orderPayment.payPandaPaymentId) {
    return res.status(400).json({ error: "Order has no Pay-Panda payment id" });
  }

  try {
    const payPanda = await getPayPandaClient();
    const result = await payPanda.verifyPayment({
      paymentId: orderPayment.payPandaPaymentId,
      orderId: orderPayment.externalOrderId,
      amount: orderPayment.amount,
      customerMobile: order.customerMobile ?? undefined,
    });
    const updated = await updateOrderFromVerification(orderPayment.id, result, "admin-verify");
    res.json({ order: updated, verification: result });
  } catch (error) {
    res.status(502).json({
      error: "Could not verify Pay-Panda payment",
      message: error instanceof Error ? error.message : "Payment verification failed",
    });
  }
});

export default router;
