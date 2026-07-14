import { Router } from "express";
import { z } from "zod";
import { sendMail, verifyMailTransport } from "../lib/mailer";

const router = Router();

const sampleMailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200).default("HexTorq mail test"),
  message: z.string().min(1).max(5000).default("SMTP delivery is configured."),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

router.get("/status", async (_req, res) => {
  try {
    await verifyMailTransport();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "SMTP verification failed",
    });
  }
});

router.post("/sample", async (req, res) => {
  if (process.env.SMTP_SAMPLE_ENABLED !== "true") {
    return res.status(403).json({
      error: "Sample mail endpoint is disabled",
      hint: "Set SMTP_SAMPLE_ENABLED=true only while testing.",
    });
  }

  const parsed = sampleMailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  const { to, subject, message } = parsed.data;
  try {
    const info = await sendMail({
      to,
      subject,
      text: message,
      html: `<p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>`,
    });

    res.status(202).json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Mail delivery failed",
    });
  }
});

export default router;
