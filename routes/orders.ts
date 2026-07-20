import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { buildPaymentRedirectUrl, getPayPandaClient, isPayPandaConfigured } from "../lib/payPanda";
import { getActiveOffers, bestOffer, effectivePrice, advanceAmountFor } from "../lib/offers";
import { orderInclude, updateOrderFromVerification, findOrderPaymentToVerify } from "../lib/orderVerification";
import { sendCheckoutCreatedEmail } from "../lib/orderEmails";

const router = Router();
router.use(requireAuth);

const checkoutSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1).max(25),
  paymentType: z.enum(["FULL", "ADVANCE"]).default("FULL"),
  customerName: z.string().min(1).max(120).optional(),
  customerEmail: z.string().email().optional(),
  customerMobile: z.string().max(30).optional(),
});

function makeOrderNumber() {
  return `HTQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function parseDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const EXPIRES_IN_MINUTES = () => Number(process.env.PAY_PANDA_EXPIRES_IN_MINUTES || 30);

router.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { rowCreatedTime: "desc" },
  });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId },
    include: orderInclude,
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

router.post("/checkout", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  if (!isPayPandaConfigured()) {
    return res.status(503).json({
      error: "Pay-Panda credentials are not configured",
      requiredEnv: ["PAY_PANDA_APP_ID", "PAY_PANDA_APP_SECRET"],
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const uniqueProjectIds = Array.from(new Set(parsed.data.projectIds));
  const { paymentType } = parsed.data;

  if (paymentType === "ADVANCE" && uniqueProjectIds.length !== 1) {
    return res.status(400).json({ error: "Pre-booking with an advance payment is only available for a single project" });
  }

  const [projects, offers] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: uniqueProjectIds } },
      select: {
        id: true,
        projectTitle: true,
        categoryId: true,
        subCategoryId: true,
        discountedPrice: true,
        recommendedPrice: true,
        originalPrice: true,
      },
    }),
    getActiveOffers(),
  ]);
  if (projects.length !== uniqueProjectIds.length) {
    return res.status(400).json({ error: "One or more projects are invalid" });
  }

  const pricedProjects = projects.map((project) => {
    const offer = bestOffer(project, offers);
    return { ...project, unitPrice: effectivePrice(project, offer?.discountPercent ?? 0), offer };
  });
  if (pricedProjects.some((project) => project.unitPrice <= 0)) {
    return res.status(400).json({ error: "One or more projects do not have a payable price" });
  }

  let advanceAmount: number | null = null;
  if (paymentType === "ADVANCE") {
    const [only] = pricedProjects;
    advanceAmount = only.offer ? advanceAmountFor(only.unitPrice, only.offer) : null;
    if (advanceAmount == null || advanceAmount <= 0) {
      return res.status(400).json({ error: "This project has no pre-booking option" });
    }
  }

  const totalAmount = pricedProjects.reduce((sum, project) => sum + project.unitPrice, 0);
  const orderNumber = makeOrderNumber();
  const customerName = parsed.data.customerName || user.name;
  const customerEmail = parsed.data.customerEmail || user.email;
  const customerMobile = parsed.data.customerMobile || user.phone || undefined;

  const paymentAmount = paymentType === "ADVANCE" ? advanceAmount! : totalAmount;
  const externalOrderId = paymentType === "ADVANCE" ? `${orderNumber}-ADV` : orderNumber;
  const purpose = paymentType === "ADVANCE" ? "ADVANCE" : "FULL";

  const created = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount,
      paymentType,
      amountPaid: 0,
      balanceDue: totalAmount,
      customerName,
      customerEmail,
      customerMobile: customerMobile ?? null,
      rowCreatedUser: userId,
      rowUpdatedUser: userId,
      items: {
        create: pricedProjects.map((project) => ({
          projectId: project.id,
          projectTitleSnapshot: project.projectTitle,
          unitPrice: project.unitPrice,
          rowCreatedUser: userId,
          rowUpdatedUser: userId,
        })),
      },
      payments: {
        create: {
          purpose,
          amount: paymentAmount,
          externalOrderId,
          rowCreatedUser: userId,
          rowUpdatedUser: userId,
        },
      },
    },
    include: orderInclude,
  });

  try {
    const payPanda = await getPayPandaClient();
    const payment = await payPanda.createPayment({
      orderId: externalOrderId,
      amount: paymentAmount,
      customerName,
      customerMobile,
      reason: `HexTorq Projects order ${orderNumber}${paymentType === "ADVANCE" ? " (advance)" : ""}`,
      redirectUrl: buildPaymentRedirectUrl(),
      expiresInMinutes: EXPIRES_IN_MINUTES(),
    });

    const createdPayment = created.payments[0];
    await prisma.orderPayment.update({
      where: { id: createdPayment.id },
      data: {
        payPandaPaymentId: payment.paymentId,
        checkoutUrl: payment.checkoutUrl,
        expiresAt: parseDate(payment.expiresAt),
        rowUpdatedUser: "pay-panda-create",
      },
    });

    const order = await prisma.order.update({
      where: { id: created.id },
      data: {
        payPandaPaymentId: payment.paymentId,
        checkoutUrl: payment.checkoutUrl,
        expiresAt: parseDate(payment.expiresAt),
        rowUpdatedUser: "pay-panda-create",
      },
      include: orderInclude,
    });

    void sendCheckoutCreatedEmail(order, payment.checkoutUrl, purpose, paymentAmount);

    res.status(201).json({ order, checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment creation failed";

    await prisma.orderPayment.update({
      where: { id: created.payments[0].id },
      data: { status: "FAILED", verificationMessage: message, rowUpdatedUser: "pay-panda-create" },
    });
    await prisma.order.update({
      where: { id: created.id },
      data: {
        status: "PAYMENT_ERROR",
        paymentStatus: "FAILED",
        verificationMessage: message,
        rowUpdatedUser: "pay-panda-create",
      },
    });

    res.status(502).json({
      error: "Could not create Pay-Panda checkout",
      message,
      orderId: created.id,
    });
  }
});

router.post("/:id/pay-balance", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;

  if (!isPayPandaConfigured()) {
    return res.status(503).json({
      error: "Pay-Panda credentials are not configured",
      requiredEnv: ["PAY_PANDA_APP_ID", "PAY_PANDA_APP_SECRET"],
    });
  }

  const order = await prisma.order.findFirst({ where: { id: String(req.params.id), userId } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "BOOKED" || order.balanceDue <= 0) {
    return res.status(400).json({ error: "This order has no outstanding balance to pay" });
  }

  const priorBalancePayments = await prisma.orderPayment.count({
    where: { orderId: order.id, purpose: "BALANCE" },
  });
  const externalOrderId = `${order.orderNumber}-BAL-${priorBalancePayments + 1}`;

  const orderPayment = await prisma.orderPayment.create({
    data: {
      orderId: order.id,
      purpose: "BALANCE",
      amount: order.balanceDue,
      externalOrderId,
      rowCreatedUser: userId,
      rowUpdatedUser: userId,
    },
  });

  try {
    const payPanda = await getPayPandaClient();
    const payment = await payPanda.createPayment({
      orderId: externalOrderId,
      amount: order.balanceDue,
      customerName: order.customerName,
      customerMobile: order.customerMobile ?? undefined,
      reason: `HexTorq Projects order ${order.orderNumber} (balance)`,
      redirectUrl: buildPaymentRedirectUrl(),
      expiresInMinutes: EXPIRES_IN_MINUTES(),
    });

    await prisma.orderPayment.update({
      where: { id: orderPayment.id },
      data: {
        payPandaPaymentId: payment.paymentId,
        checkoutUrl: payment.checkoutUrl,
        expiresAt: parseDate(payment.expiresAt),
        rowUpdatedUser: "pay-panda-create",
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        payPandaPaymentId: payment.paymentId,
        checkoutUrl: payment.checkoutUrl,
        expiresAt: parseDate(payment.expiresAt),
        rowUpdatedUser: "pay-panda-create",
      },
      include: orderInclude,
    });

    void sendCheckoutCreatedEmail(updatedOrder, payment.checkoutUrl, "BALANCE", order.balanceDue);

    res.status(201).json({ order: updatedOrder, checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    await prisma.orderPayment.update({
      where: { id: orderPayment.id },
      data: {
        status: "FAILED",
        verificationMessage: error instanceof Error ? error.message : "Payment creation failed",
        rowUpdatedUser: "pay-panda-create",
      },
    });

    res.status(502).json({
      error: "Could not create Pay-Panda checkout for the balance",
      message: error instanceof Error ? error.message : "Payment creation failed",
    });
  }
});

router.post("/:id/verify", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const order = await prisma.order.findFirst({ where: { id: String(req.params.id), userId } });
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
    const updated = await updateOrderFromVerification(orderPayment.id, result);
    res.json({ order: updated, verification: result });
  } catch (error) {
    res.status(502).json({
      error: "Could not verify Pay-Panda payment",
      message: error instanceof Error ? error.message : "Payment verification failed",
    });
  }
});

router.post("/verify-redirect", async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const rawOrderNumber = String(req.body?.order_id || req.body?.orderId || "");
  const paymentId = req.body?.pay_panda_payment_id || req.body?.payment_id || req.body?.paymentId;
  // external order ids look like "HTQ-...-ADV" / "HTQ-...-BAL-1"; the base order number is the "HTQ-..." prefix
  const orderNumber = rawOrderNumber.replace(/-(ADV|BAL-\d+)$/, "");

  const order = await prisma.order.findFirst({
    where: {
      userId,
      OR: [
        ...(orderNumber ? [{ orderNumber }] : []),
        ...(paymentId ? [{ payPandaPaymentId: String(paymentId) }] : []),
      ],
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found for callback" });

  const orderPayment = await findOrderPaymentToVerify({
    paymentId: paymentId ? String(paymentId) : null,
    orderNumber: order.orderNumber,
  });
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
    const updated = await updateOrderFromVerification(orderPayment.id, result);
    res.json({ order: updated, verification: result });
  } catch (error) {
    res.status(502).json({
      error: "Could not verify Pay-Panda payment",
      message: error instanceof Error ? error.message : "Payment verification failed",
    });
  }
});

export default router;
