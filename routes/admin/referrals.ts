import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma";
import { requireAdmin } from "../../middleware/requireAdmin";
import { sendWithdrawalStatusUpdate } from "../../lib/referralEmails";

const router = Router();
router.use(requireAdmin);

// GET /admin/referrals/stats — overview stats
router.get("/stats", async (_req, res) => {
  const [totalCodes, totalEarnings, pendingAmount, confirmedAmount, totalWithdrawn] = await Promise.all([
    prisma.referralCode.count(),
    prisma.referralEarning.count(),
    prisma.referralEarning.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    prisma.referralEarning.aggregate({ _sum: { amount: true }, where: { status: "CONFIRMED" } }),
    prisma.referralWithdrawal.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" } }),
  ]);

  res.json({
    totalCodes,
    totalEarnings,
    pendingAmount: pendingAmount._sum.amount || 0,
    confirmedAmount: confirmedAmount._sum.amount || 0,
    totalWithdrawn: totalWithdrawn._sum.amount || 0,
  });
});

// GET /admin/referrals/earnings — all referral earnings
router.get("/earnings", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.referralEarning.findMany({
      where,
      include: {
        referralCode: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { rowCreatedTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.referralEarning.count({ where }),
  ]);

  res.json({
    items: items.map((e) => ({
      id: e.id,
      referrerName: e.referralCode.user.name,
      referrerEmail: e.referralCode.user.email,
      referredName: e.referredName,
      referredEmail: e.referredEmail,
      projectTitle: e.projectTitle,
      amount: e.amount,
      status: e.status,
      createdAt: e.rowCreatedTime,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// PATCH /admin/referrals/earnings/:id — update earning status (confirm/cancel)
const updateEarningSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

router.patch("/earnings/:id", async (req, res) => {
  const parsed = updateEarningSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid status. Must be CONFIRMED or CANCELLED" });
  }

  const earning = await prisma.referralEarning.update({
    where: { id: String(req.params.id) },
    data: { status: parsed.data.status, rowUpdatedUser: "admin" },
  });

  res.json(earning);
});

// GET /admin/referrals/withdrawals — all withdrawal requests
router.get("/withdrawals", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.referralWithdrawal.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { rowCreatedTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.referralWithdrawal.count({ where }),
  ]);

  res.json({
    items: items.map((w) => ({
      id: w.id,
      userName: w.user.name,
      userEmail: w.user.email,
      amount: w.amount,
      upiId: w.upiId,
      upiHolderName: w.upiHolderName,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.rowCreatedTime,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// PATCH /admin/referrals/withdrawals/:id — approve/reject withdrawal
const updateWithdrawalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(500).optional(),
});

router.patch("/withdrawals/:id", async (req, res) => {
  const parsed = updateWithdrawalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  const withdrawal = await prisma.referralWithdrawal.findUnique({
    where: { id: String(req.params.id) },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });

  const updated = await prisma.referralWithdrawal.update({
    where: { id: withdrawal.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote || null,
      rowUpdatedUser: "admin",
    },
  });

  void sendWithdrawalStatusUpdate(
    withdrawal.user.email,
    withdrawal.user.name,
    withdrawal.amount,
    parsed.data.status,
    parsed.data.adminNote || null
  );

  res.json(updated);
});

export default router;
