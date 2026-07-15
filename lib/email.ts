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

const FROM = `"Hextorq Projects" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
const rawUrl = (process.env.FRONTEND_URL || "").trim();
const _finalUrl = rawUrl && !rawUrl.includes("localhost") ? rawUrl : "";
const BASE_URL = (_finalUrl || "https://projects.hextorq.tech").replace(/\/+$/, "");

/* ──────────────────────────────────────────────────────────────
   Premium email design system
   Dark theme default · Light mode via prefers-color-scheme
   Animations: gradient-sweep, float, fade-in
   Compatible with Apple Mail / iOS / Samsung Mail / Gmail Android
   ────────────────────────────────────────────────────────────── */

const S = {
  body: "margin:0;padding:0;background:#070b17;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
  wrap: "max-width:540px;margin:0 auto;padding:20px 10px;",
  card: "background:#0f142a;border-radius:20px;border:1px solid #1c2240;overflow:hidden;",

  header: "padding:32px 28px 20px;text-align:center;position:relative;overflow:hidden;",
  headerBg: "background:linear-gradient(145deg,#5438c0 0%,#3b34cc 45%,#0a6a8a 100%);",
  headerOverlay: "position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse 140% 70% at 50% -10%,rgba(255,255,255,0.10) 0%,transparent 70%);pointer-events:none;",
  headerShine: "position:absolute;top:0;left:-60%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);pointer-events:none;",

  logoWrap: "display:inline-flex;align-items:center;gap:10px;position:relative;z-index:1;",
  logoBox: "width:34px;height:34px;background:rgba(255,255,255,0.13);backdrop-filter:blur(2px);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;line-height:1;border:1px solid rgba(255,255,255,0.06);",
  logoText: "font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:23px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;",
  tagline: "font-size:11px;color:rgba(255,255,255,0.50);margin:6px 0 0;position:relative;z-index:1;letter-spacing:0.3px;text-transform:uppercase;",

  content: "padding:26px 28px 10px;",
  emoji: "font-size:38px;line-height:1;display:block;text-align:center;margin-bottom:4px;",
  h2: "font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:18px;font-weight:600;color:#eef2fa;margin:0 0 4px;letter-spacing:-0.02em;text-align:center;",
  p: "font-size:13.5px;color:#8790b8;line-height:1.75;margin:0 0 12px;",

  infoBox: "background:linear-gradient(135deg,rgba(84,56,192,0.06),rgba(10,106,138,0.06));border:1px solid rgba(84,56,192,0.12);border-radius:12px;padding:14px 18px;margin:14px 0;",
  infoTitle: "color:#eef2fa;font-weight:600;display:block;margin-bottom:4px;font-size:13px;",
  infoText: "font-size:12.5px;color:#97a0d0;margin:0;line-height:1.8;",

  cta: "display:inline-block;background:linear-gradient(105deg,#6d5bd0,#4f46e5 50%,#0e7aa0);color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:10px;font-size:13.5px;font-weight:600;text-align:center;box-shadow:0 4px 20px rgba(84,56,192,0.25);",

  footer: "padding:14px 28px 20px;border-top:1px solid #1c2240;text-align:center;",
  footerText: "font-size:10.5px;color:#383f6a;margin:2px 0;line-height:1.6;",
  divider: "height:1px;background:linear-gradient(90deg,transparent,#1c2240,transparent);border:none;margin:14px 0;",

  badge: "font-family:'Space Grotesk','Segoe UI',sans-serif;font-size:10px;color:#383f6a;text-transform:uppercase;letter-spacing:0.5px;",
};

function wrap(html: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  @media(max-width:480px){
    .wrap{padding:10px 4px!important}
    .content{padding:18px 16px 6px!important}
    .header{padding:24px 16px 16px!important}
    .footer{padding:10px 16px 16px!important}
    .logoText{font-size:20px!important}
    h2{font-size:16px!important}
    p{font-size:12.5px!important}
  }

  @keyframes sweep{0%{left:-60%}100%{left:120%}}
  .header-shine{animation:sweep 4.5s ease-in-out infinite}

  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
  .cta-btn{animation:float 3s ease-in-out infinite;display:inline-block}

  @keyframes fadeUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
  .fade-in{animation:fadeUp 0.5s ease-out both}
  .fade-in-d1{animation-delay:0.08s}
  .fade-in-d2{animation-delay:0.16s}
  .fade-in-d3{animation-delay:0.24s}

  @media(prefers-color-scheme:light){
    body{background:#eef0f8!important}
    .card{background:#ffffff!important;border-color:#c8cce0!important}
    h2{color:#0e1230!important}
    p{color:#30385a!important}
    .infoBox{background:linear-gradient(135deg,rgba(84,56,192,0.03),rgba(10,106,138,0.03))!important;border-color:rgba(84,56,192,0.08)!important}
    .infoTitle{color:#0e1230!important}
    .infoText{color:#40487a!important}
    .footer{border-color:#c8cce0!important}
    .footerText{color:#50588a!important}
  }
</style>
</head>
<body style="${S.body}">
  <div class="wrap" style="${S.wrap}">
    <div class="card" style="${S.card}">
      ${html}
      <div class="footer" style="${S.footer}">
        <p style="${S.footerText}">Hextorq Projects — Final-Year Project Marketplace</p>
        <p style="${S.footerText}">Need help? Reply to this email or WhatsApp us</p>
        <hr class="divider" style="${S.divider}" />
        <p style="${S.footerText};color:#282e52">You received this as a Hextorq Projects account holder.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function header(emoji: string, tagline: string) {
  return `
    <div class="header fade-in" style="${S.headerBg + S.header}">
      <div style="${S.headerOverlay}"></div>
      <div class="header-shine" style="${S.headerShine}"></div>
      <div style="${S.logoWrap}">
        <span style="${S.logoBox}">${emoji}</span>
        <span class="logoText" style="${S.logoText}">Hextorq Projects</span>
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
        Your Hextorq Projects student account is active. Explore <strong style="color:#eef2fa;font-weight:600">3,800+ ready-to-build projects</strong> across 14+ academic streams.
      </p>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">✨ What you can do now:</strong>
          <span style="color:#97a0d0">Browse by stream, tier &amp; complexity<br/>Save favourites to your wishlist<br/>Get WhatsApp support from engineers<br/>Full codebase + viva coaching</span>
        </p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${S.cta}">Browse 3,800+ Projects →</a>
      </div>
      <p style="${S.p}">Questions? Reply or WhatsApp us.</p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Projects Team</p>
    </div>`);
}

export function loginNotificationEmail(name: string) {
  return wrap(`
    ${header("🔐", "Security alert")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">🔔</span>
      <h2 style="${S.h2}">New sign-in detected</h2>
      <p style="${S.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, we noticed a new sign-in to your Hextorq Projects account. If this was you, no action needed.
      </p>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">📍 Sign-in details</strong>
          <span style="color:#97a0d0">Account: ${name}<br/>Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span>
        </p>
      </div>
      <p style="${S.p}">
        Not you? <a href="${BASE_URL}/forgot-password" style="color:#8899ee;text-decoration:underline">Reset your password</a> immediately.
      </p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/dashboard" class="cta-btn" style="${S.cta}">Go to Dashboard →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Projects Team</p>
    </div>`);
}

export function resetPasswordEmail(name: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  return wrap(`
    ${header("🔑", "Password reset")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">📧</span>
      <h2 style="${S.h2}">Reset your password</h2>
      <p style="${S.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, click below to set a new password. This link expires in <strong style="color:#eef2fa;font-weight:600">1 hour</strong>.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" class="cta-btn" style="${S.cta}">Create New Password →</a>
      </div>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">🔗 Direct link:</strong>
          <span style="word-break:break-all;font-size:12px;color:#97a0d0">${resetUrl}</span>
        </p>
      </div>
      <p style="${S.p}">Ignore this email if you didn't request a reset.</p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Projects Team</p>
    </div>`);
}

export function passwordResetConfirmationEmail(name: string) {
  return wrap(`
    ${header("✅", "Password updated")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">🎉</span>
      <h2 style="${S.h2}">Password changed successfully</h2>
      <p style="${S.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, your Hextorq Projects password has been updated.
      </p>
      <p style="${S.p}">If this was you, you're all set. If not, contact support immediately.</p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/login" class="cta-btn" style="${S.cta}">Sign In →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Projects Team</p>
    </div>`);
}

export function enquiryAdminNotification(name: string, email: string, phone: string | null, message: string, projectInfo: string) {
  return wrap(`
    ${header("📩", "New enquiry received")}
    <div class="content fade-in fade-in-d1" style="${S.content}">
      <span style="${S.emoji}">📋</span>
      <h2 style="${S.h2}">New enquiry from ${name}</h2>
      <p style="${S.p}">Details received via the website contact form:</p>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">👤 ${name}</strong>
          <span style="color:#97a0d0">
            Email: <a href="mailto:${email}" style="color:#8899ee">${email}</a><br/>
            ${phone ? `Phone: ${phone}<br/>` : ""}
            Project: ${projectInfo}<br/>
            Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </span>
        </p>
      </div>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">Message:</strong>
          <span style="color:#97a0d0">${message}</span>
        </p>
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
        We've received your enquiry. Our team will review and reach out within <strong style="color:#eef2fa;font-weight:600">24 hours</strong>. Here's your submission:
      </p>
      <div class="infoBox" style="${S.infoBox}">
        <p style="${S.infoText}">
          <strong style="${S.infoTitle}">Your message:</strong>
          <span style="color:#97a0d0">${message}</span>
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:14px 0">
        <tr>
          <td style="width:50%;padding:12px;text-align:center;background:rgba(15,20,42,0.6);border:1px solid #1c2240;border-radius:12px 0 0 12px">
            <div style="font-size:20px;line-height:1;margin-bottom:4px">⏱</div>
            <div style="${S.badge}">Response in 24h</div>
          </td>
          <td style="width:50%;padding:12px;text-align:center;background:rgba(15,20,42,0.6);border:1px solid #1c2240;border-left:none;border-radius:0 12px 12px 0">
            <div style="font-size:20px;line-height:1;margin-bottom:4px">📱</div>
            <div style="${S.badge}">WhatsApp follow-up</div>
          </td>
        </tr>
      </table>
      <p style="${S.p}">In the meantime, browse more projects or WhatsApp us.</p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${S.cta}">Browse Projects →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Projects Team</p>
    </div>`);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured. Skipping email to", to);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
