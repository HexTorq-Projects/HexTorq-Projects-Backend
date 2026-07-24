import { Router } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { optionalAuth } from "../middleware/optionalAuth";

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

  // Generate a unique code
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
    return res.json({ totalEarned: 0, pendingAmount: 0, count: 0, earnings: [] });
  }

  const totalEarned = referralCode.earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = referralCode.earnings
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  res.json({
    code: referralCode.code,
    totalEarned,
    pendingAmount,
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
// This endpoint is called by the order creation flow (internal or admin)
router.post("/claim", optionalAuth, async (req, res) => {
  const { code, referredName, referredEmail, projectTitle } = req.body;
  if (!code || !referredEmail || !projectTitle) {
    return res.status(400).json({ error: "Missing required fields: code, referredEmail, projectTitle" });
  }

  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode) {
    return res.status(404).json({ error: "Invalid referral code" });
  }

  const earning = await prisma.referralEarning.create({
    data: {
      referralCodeId: referralCode.id,
      referredName: referredName || referredEmail,
      referredEmail,
      projectTitle,
      amount: 200,
      status: "PENDING",
      rowCreatedUser: "referral-system",
      rowUpdatedUser: "referral-system",
    },
  });

  res.status(201).json({
    id: earning.id,
    amount: earning.amount,
    status: earning.status,
  });
});

export default router;
