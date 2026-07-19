import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/hash";
import { signToken } from "../lib/jwt";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { isGoogleConfigured, verifyGoogleToken } from "../lib/googleAuth";
import { generateResetToken, hashResetToken } from "../lib/resetToken";
import { sendMail } from "../lib/mailer";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  phone: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  credential: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});

const publicUser = (u: { id: string; name: string; email: string; phone: string | null }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
});

// POST /auth/register
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { name, email, password, phone } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      passwordHash,
      rowCreatedUser: "self-register",
      rowUpdatedUser: "self-register",
    },
  });

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  if (!user.passwordHash) {
    return res.status(401).json({
      error: "This account signed up with Google. Continue with Google, or use Forgot Password to set a password.",
    });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
});

// POST /auth/google
router.post("/google", async (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({ error: "Google Sign-In is not configured yet" });
  }

  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  let payload;
  try {
    payload = await verifyGoogleToken(parsed.data.credential);
  } catch {
    return res.status(401).json({ error: "Invalid Google token" });
  }
  if (!payload || !payload.email_verified || !payload.email) {
    return res.status(401).json({ error: "Invalid Google token" });
  }

  const { sub: googleId, email, name } = payload;

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId, rowUpdatedUser: "google-link" },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: name ?? email,
          googleId,
          rowCreatedUser: "google-signup",
          rowUpdatedUser: "google-signup",
        },
      });
    }
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { email } = parsed.data;
  const genericResponse = { message: "If that email exists, a reset link has been sent." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json(genericResponse);

  const token = generateResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashResetToken(token),
      resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      rowUpdatedUser: "forgot-password",
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  try {
    await sendMail({
      to: email,
      subject: "Reset your HexTorq Projects password",
      html: `<p>Click the link below to set your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  res.json(genericResponse);
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { email, token, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const invalid = () => res.status(400).json({ error: "Invalid or expired reset link" });

  if (!user || !user.resetToken || !user.resetTokenExpires) return invalid();
  if (user.resetTokenExpires < new Date()) return invalid();
  if (user.resetToken !== hashResetToken(token)) return invalid();

  const passwordHash = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      rowUpdatedUser: "reset-password",
    },
  });

  const authToken = signToken({ userId: updated.id, email: updated.email });
  res.json({ token: authToken, user: publicUser(updated) });
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
