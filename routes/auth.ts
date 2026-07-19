import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/hash";
import { signToken } from "../lib/jwt";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { isGoogleConfigured, verifyGoogleToken } from "../lib/googleAuth";
import {
  sendEmail,
  welcomeEmail,
  loginNotificationEmail,
  resetPasswordEmail,
  passwordResetConfirmationEmail,
} from "../lib/email";

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
  token: z.string().min(1),
  password: z.string().min(6).max(200),
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

  // Send welcome email (non-blocking)
  sendEmail(email, "Welcome to Hextorq! 🚀", welcomeEmail(name)).catch(console.error);

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

  // Send login notification email (non-blocking)
  sendEmail(email, "New Sign-In to Your Hextorq Account 🔐", loginNotificationEmail(user.name)).catch(console.error);

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
  let isNewUser = false;

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
      isNewUser = true;
    }
  }

  // Send welcome/login-notification email (non-blocking), matching the password-based flows
  if (isNewUser) {
    sendEmail(email, "Welcome to Hextorq! 🚀", welcomeEmail(user.name)).catch(console.error);
  } else {
    sendEmail(email, "New Sign-In to Your Hextorq Account 🔐", loginNotificationEmail(user.name)).catch(console.error);
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
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

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false, expiresAt: { gte: new Date() } },
    data: { used: true, rowUpdatedUser: "system" },
  });

  // Create a new reset token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      rowCreatedUser: "system",
      rowUpdatedUser: "system",
    },
  });

  // Send reset email (non-blocking)
  sendEmail(email, "Reset Your Hextorq Password 🔑", resetPasswordEmail(user.name, token)).catch(console.error);

  res.json({ ok: true });
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) return res.status(400).json({ error: "Invalid or expired reset token" });
  if (resetToken.used) return res.status(400).json({ error: "Reset token has already been used" });
  if (resetToken.expiresAt < new Date()) return res.status(400).json({ error: "Reset token has expired" });

  const passwordHash = await hashPassword(password);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, rowUpdatedUser: "password-reset" },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true, rowUpdatedUser: "system" },
    }),
  ]);

  // Send confirmation email (non-blocking)
  sendEmail(resetToken.user.email, "Your Hextorq Password Has Been Changed ✅", passwordResetConfirmationEmail(resetToken.user.name)).catch(
    console.error
  );

  const authToken = signToken({ userId: updatedUser.id, email: updatedUser.email });
  res.json({ token: authToken, user: publicUser(updatedUser) });
});

export default router;
