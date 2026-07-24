import prisma from "./prisma";
import { sendPaymentResultEmail } from "./orderEmails";

export const orderInclude = {
  items: {
    include: {
      project: { include: { category: true, subCategory: true, applicationArea: true } },
    },
    orderBy: { rowCreatedTime: "asc" as const },
  },
  payments: {
    orderBy: { rowCreatedTime: "asc" as const },
  },
};

function parseDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Finds the OrderPayment a Pay-Panda verify/redirect call refers to. */
export async function findOrderPaymentToVerify(opts: { paymentId?: string | null; orderNumber?: string | null }) {
  if (opts.paymentId) {
    const byPaymentId = await prisma.orderPayment.findFirst({ where: { payPandaPaymentId: opts.paymentId } });
    if (byPaymentId) return byPaymentId;
  }
  if (opts.orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber: opts.orderNumber } });
    if (order) {
      return prisma.orderPayment.findFirst({
        where: { orderId: order.id, status: "PENDING" },
        orderBy: { rowCreatedTime: "desc" },
      });
    }
  }
  return null;
}

async function claimReferral(order: { id: string; referralCode: string | null; customerName: string; customerEmail: string }, orderItems: { projectTitleSnapshot: string }[]) {
  if (!order.referralCode || !order.customerEmail) return;

  const referralCode = await prisma.referralCode.findUnique({ where: { code: order.referralCode } });
  if (!referralCode) return;

  const projectTitle = orderItems.map((i) => i.projectTitleSnapshot).join(", ") || "Project";

  const existing = await prisma.referralEarning.findFirst({
    where: { referralCodeId: referralCode.id, referredEmail: order.customerEmail },
  });
  if (existing) return;

  await prisma.referralEarning.create({
    data: {
      referralCodeId: referralCode.id,
      referredName: order.customerName || order.customerEmail,
      referredEmail: order.customerEmail,
      projectTitle,
      amount: 100,
      status: "PENDING",
      rowCreatedUser: "referral-system",
      rowUpdatedUser: "referral-system",
    },
  });
}

/**
 * Applies a Pay-Panda verification result to a single OrderPayment attempt,
 * then rolls the parent Order's amountPaid/balanceDue/status up from all its
 * payment attempts (an order can have more than one: advance now, balance later).
 */
export async function updateOrderFromVerification(orderPaymentId: string, result: any, actor = "pay-panda-verify") {
  const payment = result.payment ?? {};
  const rawStatus = payment.status || "PENDING";
  const verified = result.verified === true && rawStatus === "SUCCESS";

  const orderPayment = await prisma.orderPayment.findUnique({ where: { id: orderPaymentId } });
  if (!orderPayment) throw new Error("OrderPayment not found");

  const previousPaymentStatus = orderPayment.status;
  const wasAlreadySuccess = previousPaymentStatus === "SUCCESS";
  const newStatus = verified ? "SUCCESS" : rawStatus === "FAILED" || rawStatus === "EXPIRED" ? rawStatus : "PENDING";

  const bankRrn = payment.bankRrn || payment.bank_rrn || null;
  const paidAt = parseDate(payment.paidAt || payment.paid_at);
  const expiresAt = parseDate(payment.expiresAt || payment.expires_at);
  const verificationCode = result.code || null;
  const verificationMessage = result.message || null;

  await prisma.orderPayment.update({
    where: { id: orderPaymentId },
    data: {
      status: newStatus,
      bankRrn,
      paidAt,
      expiresAt,
      verificationCode,
      verificationMessage,
      rowUpdatedUser: actor,
    },
  });

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderPayment.orderId } });
  const amountPaid = verified && !wasAlreadySuccess ? order.amountPaid + orderPayment.amount : order.amountPaid;
  const balanceDue = Math.max(order.totalAmount - amountPaid, 0);

  const orderStatus =
    balanceDue <= 0 && amountPaid > 0
      ? "PAID"
      : amountPaid > 0
      ? "BOOKED"
      : newStatus === "FAILED" || newStatus === "EXPIRED"
      ? newStatus
      : "PENDING";
  const orderPaymentStatus = balanceDue <= 0 && amountPaid > 0 ? "SUCCESS" : amountPaid > 0 ? "PARTIAL" : newStatus;

  const updatedOrder = await prisma.order.update({
    where: { id: orderPayment.orderId },
    data: {
      amountPaid,
      balanceDue,
      status: orderStatus,
      paymentStatus: orderPaymentStatus,
      payPandaPaymentId: orderPayment.payPandaPaymentId,
      checkoutUrl: orderPayment.checkoutUrl,
      bankRrn,
      paidAt,
      expiresAt,
      verificationCode,
      verificationMessage,
      rowUpdatedUser: actor,
    },
    include: orderInclude,
  });

  // only email on a real status transition, not on repeat verify calls that change nothing
  if (newStatus !== previousPaymentStatus) {
    void sendPaymentResultEmail(updatedOrder, orderPayment.purpose as "FULL" | "ADVANCE" | "BALANCE", newStatus);
  }

  // claim referral when payment just succeeded for the first time
  if (newStatus === "SUCCESS" && !wasAlreadySuccess && order.referralCode) {
    void claimReferral(updatedOrder, updatedOrder.items);
  }

  return updatedOrder;
}
