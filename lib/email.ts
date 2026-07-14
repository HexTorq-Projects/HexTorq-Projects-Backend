import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Hextorq" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
const rawUrl = (process.env.FRONTEND_URL || "").trim();
const _finalUrl = rawUrl && !rawUrl.includes("localhost") ? rawUrl : "";
const BASE_URL = (_finalUrl || "https://projects.hextorq.tech").replace(/\/+$/, "");

const STYLES = {
  body: "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b0c15;color:#f0f2fa;margin:0;padding:0",
  container: "max-width:560px;margin:0 auto;padding:32px 20px",
  card: "background:#141624;border-radius:16px;border:1px solid #24283e;overflow:hidden",
  header: "background:linear-gradient(135deg,#6d5bd0,#4f46e5,#0e7aa0);padding:32px 28px;text-align:center",
  logo: "font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.02em",
  tagline: "font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px",
  content: "padding:28px",
  heading: "font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:600;color:#f0f2fa;margin:0 0 8px",
  text: "font-size:14px;color:#9da6cc;line-height:1.7;margin:0 0 16px",
  highlight: "background:rgba(167,183,231,0.08);border:1px solid rgba(167,183,231,0.15);border-radius:10px;padding:16px;margin:16px 0",
  highlightText: "font-size:13px;color:#a7b7e7;margin:0;line-height:1.6",
  cta: "display:inline-block;background:linear-gradient(100deg,#6d5bd0,#4f46e5 45%,#0e7aa0);color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600;text-align:center",
  footer: "padding:24px 28px;border-top:1px solid #24283e;text-align:center",
  footerText: "font-size:12px;color:#656c94;margin:2px 0",
  divider: "height:1px;background:#24283e;border:none;margin:20px 0",
};

function wrap(html: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>@media(max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:24px 20px!important}}</style>
</head>
<body style="${STYLES.body}">
  <div style="${STYLES.container}">
    <div style="${STYLES.card}">
      ${html}
      <div style="${STYLES.footer}">
        <p style="${STYLES.footerText}">Hextorq — Academic Project Marketplace</p>
        <p style="${STYLES.footerText}">Need help? Reply to this email or contact us on WhatsApp</p>
        <p style="${STYLES.footerText}color:#656c94;font-size:11px">You received this because you have an account with Hextorq.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(name: string) {
  return wrap(`
    <div style="${STYLES.header}">
      <div style="${STYLES.logo}">Hextorq</div>
      <p style="${STYLES.tagline}">Your final-year project journey starts now 🚀</p>
    </div>
    <div style="${STYLES.content}">
      <h2 style="${STYLES.heading}">Welcome, ${name}! 👋</h2>
      <p style="${STYLES.text}">
        Great to have you on board! Your Hextorq student account is now active. You can browse
        3,800+ ready-to-build projects, save them to your wishlist, and enquire about any project
        directly with our engineering team.
      </p>
      <div style="${STYLES.highlight}">
        <p style="${STYLES.highlightText}">
          <strong style="color:#d8e2ff">✨ What's next?</strong><br/>
          • Explore projects across 14+ academic streams<br/>
          • Save favourites to your personal wishlist<br/>
          • Get direct WhatsApp support from our engineers<br/>
          • Receive full codebase, setup, and viva coaching
        </p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${BASE_URL}/explore" style="${STYLES.cta}">Browse Projects →</a>
      </div>
      <p style="${STYLES.text}">
        If you have any questions, simply reply to this email or reach out on WhatsApp.
        We're here to help you graduate with distinction!
      </p>
      <p style="${STYLES.text}margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function loginNotificationEmail(name: string) {
  return wrap(`
    <div style="${STYLES.header}">
      <div style="${STYLES.logo}">Hextorq</div>
      <p style="${STYLES.tagline}">Security notice</p>
    </div>
    <div style="${STYLES.content}">
      <h2 style="${STYLES.heading}">New Sign-In to Your Account 🔐</h2>
      <p style="${STYLES.text}">
        Hi ${name}, we noticed a new sign-in to your Hextorq account. If this was you,
        no further action is needed.
      </p>
      <div style="${STYLES.highlight}">
        <p style="${STYLES.highlightText}">
          <strong style="color:#d8e2ff">📍 Sign-in details</strong><br/>
          Account: ${name}<br/>
          Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST<br/>
        </p>
      </div>
      <p style="${STYLES.text}">
        If you didn't sign in, please <a href="${BASE_URL}/forgot-password" style="color:#a7b7e7">reset your password</a>
        immediately or contact our support team.
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/dashboard" style="${STYLES.cta}">Go to Dashboard →</a>
      </div>
      <p style="${STYLES.text}margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function resetPasswordEmail(name: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  return wrap(`
    <div style="${STYLES.header}">
      <div style="${STYLES.logo}">Hextorq</div>
      <p style="${STYLES.tagline}">Password reset request</p>
    </div>
    <div style="${STYLES.content}">
      <h2 style="${STYLES.heading}">Reset Your Password 🔑</h2>
      <p style="${STYLES.text}">
        Hi ${name}, we received a request to reset your Hextorq account password.
        Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" style="${STYLES.cta}">Reset Password →</a>
      </div>
      <div style="${STYLES.highlight}">
        <p style="${STYLES.highlightText}">
          <strong style="color:#d8e2ff">🔗 Or copy this link:</strong><br/>
          <span style="word-break:break-all;font-size:12px">${resetUrl}</span>
        </p>
      </div>
      <p style="${STYLES.text}">
        If you didn't request a password reset, please ignore this email. Your password
        will remain unchanged.
      </p>
      <p style="${STYLES.text}margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function passwordResetConfirmationEmail(name: string) {
  return wrap(`
    <div style="${STYLES.header}">
      <div style="${STYLES.logo}">Hextorq</div>
      <p style="${STYLES.tagline}">Password updated</p>
    </div>
    <div style="${STYLES.content}">
      <h2 style="${STYLES.heading}">Password Changed Successfully ✅</h2>
      <p style="${STYLES.text}">
        Hi ${name}, your Hextorq account password has been updated successfully.
      </p>
      <p style="${STYLES.text}">
        If you made this change, you're all set. If you didn't, please contact our
        support team immediately.
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/login" style="${STYLES.cta}">Sign In →</a>
      </div>
      <p style="${STYLES.text}margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured. Skipping email to", to);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
