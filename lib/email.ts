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
   Random design engine
   Every email gets a unique look — gradients, accents, layouts
   ────────────────────────────────────────────────────────────── */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const headerGradients = [
  "linear-gradient(145deg,#6d5bd0 0%,#4f46e5 45%,#0e7aa0 100%)",
  "linear-gradient(145deg,#7c3aed 0%,#2563eb 50%,#0891b2 100%)",
  "linear-gradient(145deg,#8b5cf6 0%,#06b6d4 50%,#10b981 100%)",
  "linear-gradient(145deg,#a855f7 0%,#3b82f6 50%,#14b8a6 100%)",
  "linear-gradient(145deg,#6366f1 0%,#0ea5e9 50%,#84cc16 100%)",
  "linear-gradient(145deg,#d946ef 0%,#6366f1 50%,#06b6d4 100%)",
  "linear-gradient(145deg,#f59e0b 0%,#ef4444 50%,#6366f1 100%)",
  "linear-gradient(145deg,#ec4899 0%,#8b5cf6 50%,#0ea5e9 100%)",
];

const accentColors = [
  { cta: "#6d5bd0", light: "#8a7ad6", dark: "#4a3a9a" },
  { cta: "#2563eb", light: "#5388f0", dark: "#1a47a0" },
  { cta: "#0891b2", light: "#22b8d4", dark: "#06607a" },
  { cta: "#10b981", light: "#34d399", dark: "#0a7f58" },
  { cta: "#8b5cf6", light: "#a78bfa", dark: "#5e3ac2" },
  { cta: "#06b6d4", light: "#22d3ee", dark: "#048094" },
];

const bgColors = [
  "#070b17", "#0b0f1a", "#080d18", "#0a0e1c", "#090f1a",
];

const cardColors = [
  "#0f142a", "#111630", "#0e1328", "#10152e", "#0d1226",
];

const borderColors = [
  "#1c2240", "#1e2444", "#1a2040", "#202648", "#182040",
];

const taglines: Record<string, string[]> = {
  welcome: [
    "Your final-year project journey starts today",
    "Welcome to the future of academic projects",
    "Build something extraordinary this semester",
    "Your project success begins now",
  ],
  login: [
    "Security alert",
    "New device sign-in detected",
    "Account activity notification",
    "Unusual sign-in detected",
  ],
  reset: [
    "Password reset requested",
    "Reset your account password",
    "Password recovery initiated",
  ],
  resetConfirm: [
    "Password updated successfully",
    "Your account is secure",
    "Password changed",
  ],
  enquiryAdmin: [
    "New enquiry received",
    "Someone wants to connect",
    "New project enquiry",
  ],
  enquiryUser: [
    "Enquiry received",
    "We'll get back to you soon",
    "Thanks for reaching out",
  ],
};

const subBadges = [
  "Academic Project Marketplace",
  "Final-Year Project Hub",
  "Student Project Platform",
  "Engineering Project Store",
];

/* ──────────────────────────────────────────────────────────────
   Style builder — random per email
   ────────────────────────────────────────────────────────────── */

function buildTheme() {
  const bg = pick(bgColors);
  const card = pick(cardColors);
  const border = pick(borderColors);
  const headerGrad = pick(headerGradients);
  const accent = pick(accentColors);
  const badge = pick(subBadges);

  const overlayColor = accent.light;
  const shadowColor = accent.dark;

  const S = {
    body: `margin:0;padding:0;background:${bg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`,
    wrap: "max-width:540px;margin:0 auto;padding:20px 10px;",
    card: `background:${card};border-radius:20px;border:1px solid ${border};overflow:hidden;`,

    header: "padding:32px 28px 20px;text-align:center;position:relative;overflow:hidden;",
    headerBg: headerGrad,
    headerOverlay: `position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse 140% 70% at 50% -10%,${overlayColor}22 0%,transparent 70%);pointer-events:none;`,
    headerShine: "position:absolute;top:0;left:-60%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);pointer-events:none;",

    logoWrap: "display:inline-flex;align-items:center;gap:10px;position:relative;z-index:1;",
    logoBox: `width:34px;height:34px;background:rgba(255,255,255,0.13);backdrop-filter:blur(2px);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;line-height:1;border:1px solid rgba(255,255,255,0.06);`,
    logoText: "font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:23px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;",
    tagline: `font-size:11px;color:rgba(255,255,255,0.50);margin:6px 0 0;position:relative;z-index:1;letter-spacing:0.3px;text-transform:uppercase;`,

    content: "padding:26px 28px 10px;",
    emoji: "font-size:38px;line-height:1;display:block;text-align:center;margin-bottom:4px;",
    h2: "font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:18px;font-weight:600;color:#eef2fa;margin:0 0 4px;letter-spacing:-0.02em;text-align:center;",
    p: "font-size:13.5px;color:#8790b8;line-height:1.75;margin:0 0 12px;",

    infoBox: `background:linear-gradient(135deg,${accent.cta}0a,${accent.cta}06);border:1px solid ${accent.cta}1a;border-radius:12px;padding:14px 18px;margin:14px 0;`,
    infoTitle: `color:#eef2fa;font-weight:600;display:block;margin-bottom:4px;font-size:13px;`,
    infoText: `font-size:12.5px;color:#97a0d0;margin:0;line-height:1.8;`,

    cta: `display:inline-block;background:linear-gradient(105deg,${accent.cta},${accent.dark} 50%,${shadowColor});color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:10px;font-size:13.5px;font-weight:600;text-align:center;box-shadow:0 4px 20px ${accent.cta}40;`,

    footer: `padding:14px 28px 20px;border-top:1px solid ${border};text-align:center;`,
    footerText: "font-size:10.5px;color:#383f6a;margin:2px 0;line-height:1.6;",

    badge: "font-family:'Space Grotesk','Segoe UI',sans-serif;font-size:10px;color:#383f6a;text-transform:uppercase;letter-spacing:0.5px;",

    link: `color:${accent.light};text-decoration:underline`,
  };

  return { S, badge, accent };
}

function wrap(html: string, styles: Record<string, string>, badge: string) {
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
    .infoBox{background:linear-gradient(135deg,${"rgba(99,102,241,0.03)"},${"rgba(6,182,212,0.03)"})!important;border-color:${"rgba(99,102,241,0.12)"}!important}
    .infoTitle{color:#0e1230!important}
    .infoText{color:#40487a!important}
    .footer{border-color:#c8cce0!important}
    .footerText{color:#50588a!important}
  }
</style>
</head>
<body style="${styles.body}">
  <div class="wrap" style="${styles.wrap}">
    <div class="card" style="${styles.card}">
      ${html}
      <div class="footer" style="${styles.footer}">
        <p style="${styles.footerText}">Hextorq Projects — ${badge}</p>
        <p style="${styles.footerText}">Need help? Reply to this email or WhatsApp us</p>
        <hr style="height:1px;background:linear-gradient(90deg,transparent,${"#1c2240"},transparent);border:none;margin:14px 0" />
        <p style="${styles.footerText};color:#282e52">You received this as a Hextorq Projects account holder.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function header(emoji: string, tagline: string, styles: Record<string, string>) {
  return `
    <div class="header fade-in" style="${styles.headerBg};${styles.header}">
      <div style="${styles.headerOverlay}"></div>
      <div class="header-shine" style="${styles.headerShine}"></div>
      <div style="${styles.logoWrap}">
        <span style="${styles.logoBox}">${emoji}</span>
        <span class="logoText" style="${styles.logoText}">Hextorq Projects</span>
      </div>
      <p style="${styles.tagline}">${tagline}</p>
    </div>`;
}

/* ──────────────────────────────────────────────────────────────
   Random emoji / ornament helpers
   ────────────────────────────────────────────────────────────── */

const welcomeEmojis = ["👋", "🎉", "🚀", "✨", "🌟", "🔥"];
const loginEmojis = ["🔔", "👤", "🔐", "🛡️", "📱", "📍"];
const resetEmojis = ["📧", "🔑", "🔗", "✉️", "📩", "🔄"];
const confirmEmojis = ["🎉", "✅", "👍", "✨", "🔒", "🎊"];
const adminEnqEmojis = ["📋", "📩", "✉️", "📬", "📝", "📑"];
const userEnqEmojis = ["📬", "🙌", "🎉", "✅", "✉️", "📨"];

const lineDecor = ["—", "✦", "◆", "•", "‣", "›"];

/* ──────────────────────────────────────────────────────────────
   TEMPLATES  — every call = fresh random design
   ────────────────────────────────────────────────────────────── */

export function welcomeEmail(name: string) {
  const { S: st, badge } = buildTheme();
  const em = pick(welcomeEmojis);
  const t = pick(taglines.welcome);
  const dec = pick(lineDecor);
  const ctas = [
    "Browse 3,800+ Projects →",
    "Explore Projects Now →",
    "Find Your Project →",
    "Start Building →",
    "Discover Projects →",
  ];
  const ctaText = pick(ctas);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">${em}</span>
      <h2 style="${st.h2}">Welcome, ${name}!</h2>
      <p style="${st.p}">
        Your Hextorq Projects student account is active. Explore <strong style="color:#eef2fa;font-weight:600">3,800+ ready-to-build projects</strong> across 14+ academic streams.
      </p>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">✨ What you can do now:</strong>
          <span style="color:#97a0d0">Browse by stream, tier &amp; complexity<br/>Save favourites to your wishlist<br/>Get WhatsApp support from engineers<br/>Full codebase + viva coaching</span>
        </p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${st.cta}">${ctaText}</a>
      </div>
      <p style="${st.p}">Questions? Reply or WhatsApp us.</p>
      <p style="${st.p};margin-bottom:0">${dec} The Hextorq Projects Team</p>
    </div>`, st, badge);
}

export function loginNotificationEmail(name: string) {
  const { S: st, badge } = buildTheme();
  const em = pick(loginEmojis);
  const t = pick(taglines.login);
  const dec = pick(lineDecor);
  const ctas = [
    "Go to Dashboard →",
    "Secure My Account →",
    "Review Activity →",
    "Check Dashboard →",
  ];
  const ctaText = pick(ctas);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">${em}</span>
      <h2 style="${st.h2}">New sign-in detected</h2>
      <p style="${st.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, we noticed a new sign-in to your Hextorq Projects account. If this was you, no action needed.
      </p>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">📍 Sign-in details</strong>
          <span style="color:#97a0d0">Account: ${name}<br/>Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</span>
        </p>
      </div>
      <p style="${st.p}">
        Not you? <a href="${BASE_URL}/forgot-password" style="${st.link}">Reset your password</a> immediately.
      </p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/dashboard" class="cta-btn" style="${st.cta}">${ctaText}</a>
      </div>
      <p style="${st.p};margin-bottom:0">${dec} The Hextorq Projects Team</p>
    </div>`, st, badge);
}

export function resetPasswordEmail(name: string, token: string) {
  const { S: st, badge } = buildTheme();
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  const em = pick(resetEmojis);
  const t = pick(taglines.reset);
  const dec = pick(lineDecor);
  const ctas = [
    "Create New Password →",
    "Reset Password →",
    "Set New Password →",
    "Recover Account →",
  ];
  const ctaText = pick(ctas);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">${em}</span>
      <h2 style="${st.h2}">Reset your password</h2>
      <p style="${st.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, click below to set a new password. This link expires in <strong style="color:#eef2fa;font-weight:600">1 hour</strong>.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" class="cta-btn" style="${st.cta}">${ctaText}</a>
      </div>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">🔗 Direct link:</strong>
          <span style="word-break:break-all;font-size:12px;color:#97a0d0">${resetUrl}</span>
        </p>
      </div>
      <p style="${st.p}">Ignore this email if you didn't request a reset.</p>
      <p style="${st.p};margin-bottom:0">${dec} The Hextorq Projects Team</p>
    </div>`, st, badge);
}

export function passwordResetConfirmationEmail(name: string) {
  const { S: st, badge } = buildTheme();
  const em = pick(confirmEmojis);
  const t = pick(taglines.resetConfirm);
  const dec = pick(lineDecor);
  const ctas = [
    "Sign In →",
    "Log In →",
    "Access Account →",
    "Go to Login →",
  ];
  const ctaText = pick(ctas);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">${em}</span>
      <h2 style="${st.h2}">Password changed successfully</h2>
      <p style="${st.p}">
        Hi <strong style="color:#eef2fa;font-weight:600">${name}</strong>, your Hextorq Projects password has been updated.
      </p>
      <p style="${st.p}">If this was you, you're all set. If not, contact support immediately.</p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/login" class="cta-btn" style="${st.cta}">${ctaText}</a>
      </div>
      <p style="${st.p};margin-bottom:0">${dec} The Hextorq Projects Team</p>
    </div>`, st, badge);
}

export function enquiryAdminNotification(name: string, email: string, phone: string | null, message: string, projectInfo: string) {
  const { S: st, badge } = buildTheme();
  const em = pick(adminEnqEmojis);
  const t = pick(taglines.enquiryAdmin);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">📋</span>
      <h2 style="${st.h2}">New enquiry from ${name}</h2>
      <p style="${st.p}">Details received via the website contact form:</p>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">👤 ${name}</strong>
          <span style="color:#97a0d0">
            Email: <a href="mailto:${email}" style="${st.link}">${email}</a><br/>
            ${phone ? `Phone: ${phone}<br/>` : ""}
            Project: ${projectInfo}<br/>
            Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </span>
        </p>
      </div>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">Message:</strong>
          <span style="color:#97a0d0">${message}</span>
        </p>
      </div>
      <div style="text-align:center;margin:18px 0">
        <a href="mailto:${email}" style="${st.cta}">Reply via Email →</a>
      </div>
    </div>`, st, badge);
}

export function enquiryUserConfirmation(name: string, message: string) {
  const { S: st, badge } = buildTheme();
  const em = pick(userEnqEmojis);
  const t = pick(taglines.enquiryUser);
  const dec = pick(lineDecor);
  const ctas = [
    "Browse Projects →",
    "Explore More →",
    "View Projects →",
    "Continue Browsing →",
  ];
  const ctaText = pick(ctas);
  return wrap(`
    ${header(em, t, st)}
    <div class="content fade-in fade-in-d1" style="${st.content}">
      <span style="${st.emoji}">📬</span>
      <h2 style="${st.h2}">Thanks, ${name}!</h2>
      <p style="${st.p}">
        We've received your enquiry. Our team will review and reach out within <strong style="color:#eef2fa;font-weight:600">24 hours</strong>. Here's your submission:
      </p>
      <div class="infoBox" style="${st.infoBox}">
        <p style="${st.infoText}">
          <strong style="${st.infoTitle}">Your message:</strong>
          <span style="color:#97a0d0">${message}</span>
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:14px 0">
        <tr>
          <td style="width:50%;padding:12px;text-align:center;background:rgba(15,20,42,0.6);border:1px solid #1c2240;border-radius:12px 0 0 12px">
            <div style="font-size:20px;line-height:1;margin-bottom:4px">⏱</div>
            <div style="${st.badge}">Response in 24h</div>
          </td>
          <td style="width:50%;padding:12px;text-align:center;background:rgba(15,20,42,0.6);border:1px solid #1c2240;border-left:none;border-radius:0 12px 12px 0">
            <div style="font-size:20px;line-height:1;margin-bottom:4px">📱</div>
            <div style="${st.badge}">WhatsApp follow-up</div>
          </td>
        </tr>
      </table>
      <p style="${st.p}">In the meantime, browse more projects or WhatsApp us.</p>
      <div style="text-align:center;margin:18px 0">
        <a href="${BASE_URL}/explore" class="cta-btn" style="${st.cta}">${ctaText}</a>
      </div>
      <p style="${st.p};margin-bottom:0">${dec} The Hextorq Projects Team</p>
    </div>`, st, badge);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured. Skipping email to", to);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
