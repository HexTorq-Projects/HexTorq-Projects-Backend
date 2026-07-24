import { Router } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { optionalAuth } from "../middleware/optionalAuth";
import { sendReferralEarningNotification, sendReferralWithdrawalRequestToAdmin, sendWithdrawalStatusUpdate } from "../lib/referralEmails";

const router = Router();

function generateReferralCode(name: string): string {
  const prefix = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4) || "USER";
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

// GET /referrals/my-code — get or create the logged-in user's referral code
router.get("/my-code", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { referralCode: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.referralCode) {
    return res.json({ code: user.referralCode.code });
  }

  let code = generateReferralCode(user.name);
  let existing = await prisma.referralCode.findUnique({ where: { code } });
  let attempts = 0;
  while (existing && attempts < 10) {
    code = generateReferralCode(user.name + String(attempts));
    existing = await prisma.referralCode.findUnique({ where: { code } });
    attempts++;
  }

  const referralCode = await prisma.referralCode.create({
    data: {
      code,
      userId,
      rowCreatedUser: userId,
      rowUpdatedUser: userId,
    },
  });

  res.json({ code: referralCode.code });
});

// GET /referrals/earnings — get referral earnings for the logged-in user
router.get("/earnings", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId },
    include: {
      earnings: {
        orderBy: { rowCreatedTime: "desc" },
      },
    },
  });

  if (!referralCode) {
    return res.json({ totalEarned: 0, pendingAmount: 0, confirmedAmount: 0, count: 0, earnings: [] });
  }

  const totalEarned = referralCode.earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = referralCode.earnings
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);
  const confirmedAmount = referralCode.earnings
    .filter((e) => e.status === "CONFIRMED")
    .reduce((sum, e) => sum + e.amount, 0);

  res.json({
    code: referralCode.code,
    totalEarned,
    pendingAmount,
    confirmedAmount,
    count: referralCode.earnings.length,
    earnings: referralCode.earnings.map((e) => ({
      id: e.id,
      referredName: e.referredName,
      referredEmail: e.referredEmail,
      projectTitle: e.projectTitle,
      amount: e.amount,
      status: e.status,
      createdAt: e.rowCreatedTime,
    })),
  });
});

// POST /referrals/claim — for use when an order is placed with a referral code
router.post("/claim", optionalAuth, async (req, res) => {
  const { code, referredName, referredEmail, projectTitle } = req.body;
  if (!code || !referredEmail || !projectTitle) {
    return res.status(400).json({ error: "Missing required fields: code, referredEmail, projectTitle" });
  }

  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!referralCode) {
    return res.status(404).json({ error: "Invalid referral code" });
  }

  const existing = await prisma.referralEarning.findFirst({
    where: { referralCodeId: referralCode.id, referredEmail },
  });
  if (existing) {
    return res.status(200).json({ id: existing.id, amount: existing.amount, status: existing.status });
  }

  const earning = await prisma.referralEarning.create({
    data: {
      referralCodeId: referralCode.id,
      referredName: referredName || referredEmail,
      referredEmail,
      projectTitle,
      amount: 100,
      status: "PENDING",
      rowCreatedUser: "referral-system",
      rowUpdatedUser: "referral-system",
    },
  });

  void sendReferralEarningNotification(referralCode.user.email, referralCode.user.name, referredEmail, projectTitle, 100);

  res.status(201).json({
    id: earning.id,
    amount: earning.amount,
    status: earning.status,
  });
});

// GET /referrals/balance — get the user's withdrawable balance
router.get("/balance", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId },
    include: {
      earnings: { where: { status: "CONFIRMED" } },
      withdrawals: { where: { status: { in: ["PENDING", "APPROVED"] } } },
    },
  });

  const earned = referralCode?.earnings.reduce((s, e) => s + e.amount, 0) || 0;
  const withdrawn = referralCode?.withdrawals.reduce((s, w) => s + w.amount, 0) || 0;

  res.json({ availableBalance: earned - withdrawn, totalEarned: earned, totalWithdrawn: withdrawn });
});

// POST /referrals/withdraw — submit a withdrawal request
router.post("/withdraw", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const { amount, upiId, upiHolderName } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ error: "Minimum withdrawal amount is ₹100" });
  }
  if (!upiId || !upiHolderName) {
    return res.status(400).json({ error: "UPI ID and UPI holder name are required" });
  }

  const referralCode = await prisma.referralCode.findUnique({
    where: { userId },
    include: {
      earnings: { where: { status: "CONFIRMED" } },
      withdrawals: { where: { status: { in: ["PENDING", "APPROVED"] } } },
    },
  });

  const earned = referralCode?.earnings.reduce((s, e) => s + e.amount, 0) || 0;
  const withdrawn = referralCode?.withdrawals.reduce((s, w) => s + w.amount, 0) || 0;
  const available = earned - withdrawn;

  if (amount > available) {
    return res.status(400).json({ error: `Insufficient balance. Available: ₹${available}` });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const withdrawal = await prisma.referralWithdrawal.create({
    data: {
      userId,
      amount,
      upiId,
      upiHolderName,
      status: "PENDING",
      rowCreatedUser: userId,
      rowUpdatedUser: userId,
    },
  });

  void sendReferralWithdrawalRequestToAdmin(user.name, user.email, amount, upiId, upiHolderName);

  res.status(201).json({
    id: withdrawal.id,
    amount: withdrawal.amount,
    status: withdrawal.status,
  });
});

// GET /referrals/withdrawals — get the user's withdrawal history
router.get("/withdrawals", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const withdrawals = await prisma.referralWithdrawal.findMany({
    where: { userId },
    orderBy: { rowCreatedTime: "desc" },
  });

  res.json(withdrawals.map((w) => ({
    id: w.id,
    amount: w.amount,
    upiId: w.upiId,
    upiHolderName: w.upiHolderName,
    status: w.status,
    adminNote: w.adminNote,
    createdAt: w.rowCreatedTime,
  })));
});

export default router;
