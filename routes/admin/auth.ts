import { Router } from "express";
import { z } from "zod";
import { isAdminConfigured, verifyAdminCredentials } from "../../lib/adminAuth";
import { signToken } from "../../lib/jwt";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /admin/login
router.post("/login", async (req, res) => {
  if (!isAdminConfigured()) {
    return res.status(503).json({ error: "Admin login is not configured yet" });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { email, password } = parsed.data;
  if (!verifyAdminCredentials(email, password)) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  const token = signToken({ userId: "admin", email, isAdmin: true });
  res.json({ token, admin: { email } });
});

export default router;
