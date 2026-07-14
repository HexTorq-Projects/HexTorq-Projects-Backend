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

/* ------------------------------------------------------------------ */
/*  Premium email design system                                       */
/*  Dark theme default · Light mode via prefers-color-scheme          */
/*  Animations: gradient-sweep, float, pulse — Apple Mail / iOS /     */
/*  Samsung Mail / modern Gmail Android.                              */
/* ------------------------------------------------------------------ */

const S = {
  body: "margin:0;padding:0;background:#080b14;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
  wrap: "max-width:560px;margin:0 auto;padding:24px 12px;",
  card: "background:#101428;border-radius:18px;border:1px solid #1e2440;overflow:hidden;",

  header: "padding:28px 28px 22px;text-align:center;position:relative;overflow:hidden;",
  headerBg: "background:linear-gradient(135deg,#6d5bd0 0%,#4f46e5 50%,#0e7aa0 100%);",
  headerOverlay: "position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse 120% 80% at 50% -20%,rgba(255,255,255,0.08) 0%,transparent 70%);pointer-events:none;",
  headerShine: "position:absolute;top:0;left:-60%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);pointer-events:none;",

  logoWrap: "display:inline-flex;align-items:center;gap:8px;position:relative;z-index:1;",
  logoIcon: "width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;line-height:1;",
  logoText: "font-family:'Space Grotesk',system-ui,sans-serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.03em;",
  tagline: "font-size:12px;color:rgba(255,255,255,0.55);margin:4px 0 0;position:relative;z-index:1;letter-spacing:0.2px;",

  content: "padding:28px 28px 12px;",
  emoji: "font-size:40px;line-height:1;display:block;text-align:center;margin-bottom:6px;",
  h2: "font-family:'Space Grotesk',system-ui,sans-serif;font-size:19px;font-weight:600;color:#eef2fa;margin:0 0 4px;letter-spacing:-0.02em;",
  p: "font-size:14px;color:#8892b8;line-height:1.7;margin:0 0 14px;",
  strong: "color:#eef2fa;font-weight:600;",

  highlight: "background:linear-gradient(135deg,rgba(109,91,208,0.06),rgba(14,122,160,0.06));border:1px solid rgba(109,91,208,0.12);border-radius:10px;padding:16px 18px;margin:14px 0;",
  highlightText: "font-size:13px;color:#9db0e8;margin:0;line-height:1.7;",

  cta: "display:inline-block;background:linear-gradient(100deg,#6d5bd0,#4f46e5 50%,#0e7aa0);color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600;text-align:center;box-shadow:0 4px 16px rgba(109,91,208,0.25);",

  footer: "padding:16px 28px 22px;border-top:1px solid #1e2440;text-align:center;",
  footerText: "font-size:11px;color:#3c4268;margin:2px 0;line-height:1.6;",
  divider: "height:1px;background:linear-gradient(90deg,transparent,#1e2440,transparent);border:none;margin:16px 0;",

  tableRow: "border-bottom:1px solid #1a1f38;",
  tableLabel: "padding:8px 12px;background:rgba(109,91,208,0.04);color:#8892b8;font-size:12px;font-weight:600;width:90px;vertical-align:top;",
  tableValue: "padding:8px 12px;color:#eef2fa;font-size:13px;",
};

function wrap(html: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  @media(max-width:480px){
    .wrap{padding:12px 6px!important}
    .content{padding:20px 18px 8px!important}
    .header{padding:22px 18px 18px!important}
    .footer{padding:12px 18px 18px!important}
    h2{font-size:17px!important}
    p{font-size:13px!important}
  }

  /* ── gradient sweep animation ── */
  @keyframes sweep{0%{left:-60%}100%{left:120%}}
  .header-shine{animation:sweep 4s ease-in-out infinite}

  /* ── subtle float on CTA ── */
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
  .cta-btn{animation:float 3s ease-in-out infinite;display:inline-block}

  /* ── fade-in entrance ── */
  @keyframes fadeUp{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
  .fade-in{animation:fadeUp 0.6s ease-out both}
  .fade-in-d1{animation-delay:0.1s}
  .fade-in-d2{animation-delay:0.2s}
  .fade-in-d3{animation-delay:0.3s}

  /* ── light mode ── */
  @media(prefers-color-scheme:light){
    body{background:#f0f2fa!important}
    .card{background:#ffffff!important;border-color:#d0d4e8!important}
    h2{color:#12162a!important}
    p{color:#383f62!important}
    .strong{color:#12162a!important}
    .highlight{background:linear-gradient(135deg,rgba(109,91,208,0.03),rgba(14,122,160,0.03))!important;border-color:rgba(109,91,208,0.08)!important}
    .highlightText{color:#4c63b6!important}
    .footer{border-color:#d0d4e8!important}
    .footerText{color:#5a6184!important}
    .tableLabel{color:#383f62!important;background:rgba(109,91,208,0.02)!important}
    .tableValue{color:#12162a!important}
    .tableRow{border-color:#e0e3f2!important}
  }
</style>
</head>
<body style="${S.body}">
  <div class="wrap" style="${S.wrap}">
    <div class="card" style="${S.card}">
      ${html}
      <div class="footer" style="${S.footer}">
        <p style="${S.footerText}">Hextorq — Academic Project Marketplace</p>
        <p style="${S.footerText}">Need help? Reply or WhatsApp us</p>
        <hr class="divider" style="${S.divider}" />
        <p style="${S.footerText};color:#2a2f50">You received this as a Hextorq account holder.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function header(logoEmoji: string, tagline: string) {
  return `
    <div class="header fade-in" style="${S.headerBg + S.header}">
      <div style="${S.headerOverlay}"></div>
      <div class="header-shine" style="${S.headerShine}"></div>
      <div style="${S.logoWrap}">
        <span style="${S.logoIcon}">${logoEmoji}</span>
        <span style="${S.logoText}">Hextorq</span>
      </div>
      <p style="${S.tagline}">${tagline}</p>
    </div>`;
}

/* ──────────────────────────────────────────── */
/*  TEMPLATES                                   */
/* ──────────────────────────────────────────── */

export function welcomeEmail(name: string) {
  return wrap(`
    ${header("🚀", "Your final-year project journey starts today")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">👋</span>
      <h2 style="${S.h2}">Welcome, ${name}!</h2>
      <p style="${S.p}">
        Your Hextorq student account is active. Explore <strong class="strong" style="${S.strong}">3,800+ ready-to-build projects</strong> across 14+ academic streams.
      </p>
      <div class="highlight" style="${S.highlight}">
        <p class="highlightText" style="${S.highlightText}">
          <strong style="color:#eef2fa;display:block;margin-bottom:6px">✨ What you can do now:</strong>
          • Browse by stream, tier &amp; complexity<br/>
          • Save favourites to your wishlist<br/>
          • Get WhatsApp support from engineers<br/>
          • Full codebase + viva coaching
        </p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${S.cta}">Browse 3,800+ Projects →</a>
      </div>
      <p style="${S.p}">Questions? Reply to this email or WhatsApp us.</p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>`);
}

export function loginNotificationEmail(name: string) {
  return wrap(`
    ${header("🔐", "New sign-in alert")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">👤</span>
      <h2 style="${S.h2}">New sign-in detected</h2>
      <p style="${S.p}">
        Hi <strong class="strong" style="${S.strong}">${name}</strong>, we noticed a new sign-in to your Hextorq account. If this was you, no action needed.
      </p>
      <div class="highlight" style="${S.highlight}">
        <p class="highlightText" style="${S.highlightText}">
          <strong style="color:#eef2fa;display:block;margin-bottom:4px">📍 Details</strong>
          Account: ${name}<br/>
          Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
        </p>
      </div>
      <p style="${S.p}">
        Not you? <a href="${BASE_URL}/forgot-password" style="color:#9db0e8;text-decoration:underline">Reset your password</a> immediately.
      </p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/dashboard" class="cta-btn" style="${S.cta}">Go to Dashboard →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>`);
}

export function resetPasswordEmail(name: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  return wrap(`
    ${header("🔑", "Password reset requested")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">📧</span>
      <h2 style="${S.h2}">Reset your password</h2>
      <p style="${S.p}">
        Hi <strong class="strong" style="${S.strong}">${name}</strong>, click below to set a new password. This link expires in <strong class="strong" style="${S.strong}">1 hour</strong>.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" class="cta-btn" style="${S.cta}">Create New Password →</a>
      </div>
      <div class="highlight" style="${S.highlight}">
        <p class="highlightText" style="${S.highlightText}">
          <strong style="color:#eef2fa;display:block;margin-bottom:4px">🔗 Direct link:</strong>
          <span style="word-break:break-all;font-size:12px;color:#8892b8">${resetUrl}</span>
        </p>
      </div>
      <p style="${S.p}">Ignore this email if you didn't request a reset.</p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>`);
}

export function passwordResetConfirmationEmail(name: string) {
  return wrap(`
    ${header("✅", "Password updated")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">🎉</span>
      <h2 style="${S.h2}">Password changed successfully</h2>
      <p style="${S.p}">
        Hi <strong class="strong" style="${S.strong}">${name}</strong>, your Hextorq password has been updated.
      </p>
      <p style="${S.p}">If this was you, you're all set. If not, contact support immediately.</p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/login" class="cta-btn" style="${S.cta}">Sign In →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>`);
}

export function enquiryAdminNotification(name: string, email: string, phone: string | null, message: string, projectInfo: string) {
  return wrap(`
    ${header("📩", "New enquiry captured")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">📋</span>
      <h2 style="${S.h2}">New enquiry from ${name}</h2>
      <p style="${S.p}">Details received via the website contact form:</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;border-radius:10px;overflow:hidden">
        <tr class="tableRow" style="${S.tableRow}">
          <td class="tableLabel" style="${S.tableLabel}">Name</td>
          <td class="tableValue" style="${S.tableValue}">${name}</td>
        </tr>
        <tr class="tableRow" style="${S.tableRow}">
          <td class="tableLabel" style="${S.tableLabel}">Email</td>
          <td class="tableValue" style="${S.tableValue}"><a href="mailto:${email}" style="color:#9db0e8">${email}</a></td>
        </tr>
        ${phone ? `<tr class="tableRow" style="${S.tableRow}">
          <td class="tableLabel" style="${S.tableLabel}">Phone</td>
          <td class="tableValue" style="${S.tableValue}">${phone}</td>
        </tr>` : ""}
        <tr class="tableRow" style="${S.tableRow}">
          <td class="tableLabel" style="${S.tableLabel}">Project</td>
          <td class="tableValue" style="${S.tableValue}">${projectInfo}</td>
        </tr>
        <tr>
          <td class="tableLabel" style="${S.tableLabel};border-bottom:none">Time</td>
          <td class="tableValue" style="${S.tableValue};border-bottom:none">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
        </tr>
      </table>
      <div class="highlight" style="${S.highlight}">
        <p class="highlightText" style="${S.highlightText}"><strong style="color:#eef2fa;display:block;margin-bottom:4px">Message:</strong>${message}</p>
      </div>
      <div style="text-align:center;margin:18px 0">
        <a href="mailto:${email}" class="cta-btn" style="${S.cta}">Reply via Email →</a>
      </div>
    </div>`);
}

export function enquiryUserConfirmation(name: string, message: string) {
  return wrap(`
    ${header("🙌", "Enquiry received")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">📬</span>
      <h2 style="${S.h2}">Thanks, ${name}!</h2>
      <p style="${S.p}">
        We've received your enquiry. Our team will review and reach out within <strong class="strong" style="${S.strong}">24 hours</strong>. Here's your submission:
      </p>
      <div class="highlight" style="${S.highlight}">
        <p class="highlightText" style="${S.highlightText}"><strong style="color:#eef2fa;display:block;margin-bottom:4px">Your message:</strong>${message}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:14px 0">
        <tr>
          <td style="width:50%;padding:10px;text-align:center;background:rgba(255,255,255,0.02);border:1px solid #1e2440;border-radius:10px 0 0 10px">
            <div style="font-size:22px;font-weight:700;color:#eef2fa;font-family:'Space Grotesk',sans-serif">⏱</div>
            <div style="font-size:10px;color:#3c4268;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">Response in 24h</div>
          </td>
          <td style="width:50%;padding:10px;text-align:center;background:rgba(255,255,255,0.02);border:1px solid #1e2440;border-left:none;border-radius:0 10px 10px 0">
            <div style="font-size:22px;font-weight:700;color:#eef2fa;font-family:'Space Grotesk',sans-serif">📱</div>
            <div style="font-size:10px;color:#3c4268;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">WhatsApp follow-up</div>
          </td>
        </tr>
      </table>
      <p style="${S.p}">In the meantime, browse more projects or WhatsApp us for faster support.</p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${S.cta}">Browse Projects →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>`);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured. Skipping email to", to);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
