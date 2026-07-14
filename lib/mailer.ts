import nodemailer from "nodemailer";

export interface MailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

const requiredMailEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;

function readMailConfig() {
  const missing = requiredMailEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing SMTP environment variables: ${missing.join(", ")}`);
  }

  return {
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.SMTP_FROM!,
  };
}

export function createMailTransport() {
  const config = readMailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendMail(message: MailMessage) {
  if (!message.text && !message.html) {
    throw new Error("Mail message requires text or html content");
  }

  const config = readMailConfig();
  const transport = createMailTransport();

  return transport.sendMail({
    from: config.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
  });
}

export async function verifyMailTransport() {
  const transport = createMailTransport();
  await transport.verify();
}
