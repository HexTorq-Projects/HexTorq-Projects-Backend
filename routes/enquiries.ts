import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { optionalAuth } from "../middleware/optionalAuth";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";

const router = Router();

const enquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().min(1).max(5000),
  projectId: z.string().uuid().optional(),
});

// POST /enquiries  (guests allowed; auto-links userId when logged in)
router.post("/", optionalAuth, async (req, res) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

  const { name, email, phone, message, projectId } = parsed.data;
  const userId = (req as AuthedRequest).userId ?? null;

  if (projectId) {
    const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!exists) return res.status(400).json({ error: "Unknown projectId" });
  }

  const actor = userId ?? "guest";
  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      message,
      status: "NEW",
      projectId: projectId ?? null,
      userId,
      rowCreatedUser: actor,
      rowUpdatedUser: actor,
    },
    select: { id: true, status: true, rowCreatedTime: true },
  });
  res.status(201).json(enquiry);
});

// GET /enquiries/me  (a logged-in student's enquiry history)
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId!;
  const enquiries = await prisma.enquiry.findMany({
    where: { userId },
    include: {
      project: {
        select: { id: true, projectTitle: true, recommendedPrice: true, discountedPrice: true },
      },
    },
    orderBy: { rowCreatedTime: "desc" },
  });
  res.json(enquiries);
});

export default router;
