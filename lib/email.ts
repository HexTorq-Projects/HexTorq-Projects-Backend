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

const S = {
  body: "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0c14;color:#e8ecf4;margin:0;padding:0;",
  wrap: "max-width:580px;margin:0 auto;padding:28px 16px;",
  card: "background:linear-gradient(180deg,#14182a 0%,#101424 100%);border-radius:20px;border:1px solid #1e2340;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4);",
  header: "background:linear-gradient(135deg,#6d5bd0 0%,#4f46e5 50%,#0e7aa0 100%);padding:36px 32px 32px;text-align:center;position:relative;overflow:hidden;",
  headerGlow: "position:absolute;top:-40%;right:-20%;width:200px;height:200px;background:radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%);border-radius:50%;pointer-events:none;",
  logo: "font-family:'Space Grotesk',system-ui,sans-serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.03em;position:relative;z-index:1;",
  tagline: "font-size:13px;color:rgba(255,255,255,0.65);margin-top:6px;position:relative;z-index:1;",
  content: "padding:32px 32px 28px;",
  h2: "font-family:'Space Grotesk',system-ui,sans-serif;font-size:20px;font-weight:600;color:#e8ecf4;margin:0 0 6px;letter-spacing:-0.02em;",
  p: "font-size:14px;color:#8b95b8;line-height:1.7;margin:0 0 16px;",
  highlight: "background:linear-gradient(135deg,rgba(109,91,208,0.08) 0%,rgba(14,122,160,0.08) 100%);border:1px solid rgba(109,91,208,0.15);border-radius:12px;padding:18px 20px;margin:18px 0;",
  highlightText: "font-size:13px;color:#a7b7e7;margin:0;line-height:1.7;",
  cta: "display:inline-block;background:linear-gradient(100deg,#6d5bd0,#4f46e5 45%,#0e7aa0);color:#fff;text-decoration:none;padding:14px 34px;border-radius:12px;font-size:14px;font-weight:600;text-align:center;box-shadow:0 4px 20px rgba(109,91,208,0.3);",
  ctaHover: "box-shadow:0 6px 28px rgba(109,91,208,0.45);transform:translateY(-1px);",
  footer: "padding:20px 32px 28px;border-top:1px solid #1e2340;text-align:center;",
  footerText: "font-size:12px;color:#4a5173;margin:3px 0;line-height:1.6;",
  divider: "height:1px;background:linear-gradient(to right,transparent,#1e2340,transparent);border:none;margin:20px 0;",
  badge: "display:inline-block;background:rgba(109,91,208,0.15);border:1px solid rgba(109,91,208,0.25);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;color:#a7b7e7;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;",
  statBox: "background:rgba(255,255,255,0.03);border:1px solid #1e2340;border-radius:12px;padding:16px;text-align:center;",
  statValue: "font-size:22px;font-weight:700;color:#e8ecf4;font-family:'Space Grotesk',system-ui,sans-serif;",
  statLabel: "font-size:11px;color:#4a5173;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;",
};

function wrap(html: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  @media(max-width:480px){.wrap{padding:16px 8px!important}.content{padding:24px 20px 20px!important}.header{padding:28px 20px 24px!important}.footer{padding:16px 20px 24px!important}h2{font-size:18px!important}}
  @media(prefers-color-scheme:light){body{background:#f2f4fc!important}.card{background:linear-gradient(180deg,#ffffff 0%,#f8f9ff 100%)!important;border-color:#d3d6e8!important}h2{color:#141829!important}p{color:#3a4160!important}.highlight{background:linear-gradient(135deg,rgba(109,91,208,0.04) 0%,rgba(14,122,160,0.04) 100%)!important;border-color:rgba(109,91,208,0.1)!important}.highlightText{color:#4c63b6!important}.footer{border-color:#d3d6e8!important}.footerText{color:#5b6386!important}.statBox{background:rgba(0,0,0,0.02)!important;border-color:#d3d6e8!important}.statValue{color:#141829!important}.statLabel{color:#5b6386!important}.badge{background:rgba(76,99,182,0.08)!important;border-color:rgba(76,99,182,0.15)!important;color:#4c63b6!important}}
</style>
</head>
<body style="${S.body}">
  <div class="wrap" style="${S.wrap}">
    <div class="card" style="${S.card}">
      ${html}
      <div class="footer" style="${S.footer}">
        <p style="${S.footerText}">Hextorq — Academic Project Marketplace</p>
        <p style="${S.footerText}">Need help? Reply to this email or WhatsApp us</p>
        <hr style="${S.divider}" />
        <p style="${S.footerText};font-size:11px;color:#383d5c">You received this because you have an account with Hextorq.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmail(name: string) {
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">Your final-year project journey starts today</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">🚀</div>
      </div>
      <h2 style="${S.h2}">Welcome aboard, ${name}!</h2>
      <p style="${S.p}">
        Your Hextorq student account is now active. You now have access to <strong style="color:#e8ecf4">3,800+ ready-to-build projects</strong> across 14+ academic streams.
      </p>
      <div style="${S.highlight}">
        <p style="${S.highlightText}">
          <strong style="color:#e8ecf4;display:block;margin-bottom:8px">✨ Here's what you can do now:</strong>
          • Browse projects by stream, tier &amp; complexity<br/>
          • Save favourites to your personal wishlist<br/>
          • Enquire &amp; get WhatsApp support from engineers<br/>
          • Receive full codebase with setup &amp; viva coaching
        </p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${BASE_URL}/explore" style="${S.cta}">Browse 3,800+ Projects →</a>
      </div>
      <p style="${S.p}">
        If you have any questions, simply reply to this email or reach out on WhatsApp. Our team is ready to help you graduate with distinction.
      </p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function loginNotificationEmail(name: string) {
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">Security alert</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">🔐</div>
      </div>
      <h2 style="${S.h2}">New sign-in detected</h2>
      <p style="${S.p}">
        Hi <strong style="color:#e8ecf4">${name}</strong>, we noticed a new sign-in to your Hextorq account. If this was you, no action is needed.
      </p>
      <div style="${S.highlight}">
        <p style="${S.highlightText}">
          <strong style="color:#e8ecf4;display:block;margin-bottom:6px">📍 Sign-in details</strong>
          Account: ${name}<br/>
          Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
        </p>
      </div>
      <p style="${S.p}">
        Didn't recognise this sign-in? <a href="${BASE_URL}/forgot-password" style="color:#a7b7e7;text-decoration:underline">Reset your password</a> immediately.
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${BASE_URL}/dashboard" style="${S.cta}">Go to Dashboard →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function resetPasswordEmail(name: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">Password reset requested</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">🔑</div>
      </div>
      <h2 style="${S.h2}">Reset your password</h2>
      <p style="${S.p}">
        Hi <strong style="color:#e8ecf4">${name}</strong>, we received a request to reset your Hextorq password. Click below to set a new one. This link expires in <strong style="color:#e8ecf4">1 hour</strong>.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="${S.cta}">Create New Password →</a>
      </div>
      <div style="${S.highlight}">
        <p style="${S.highlightText}">
          <strong style="color:#e8ecf4;display:block;margin-bottom:4px">🔗 Direct link:</strong>
          <span style="word-break:break-all;font-size:12px;color:#8b95b8">${resetUrl}</span>
        </p>
      </div>
      <p style="${S.p}">
        If you didn't request this, please ignore this email. Your password will remain unchanged.
      </p>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function passwordResetConfirmationEmail(name: string) {
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">Password updated</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">✅</div>
      </div>
      <h2 style="${S.h2}">Password changed successfully</h2>
      <p style="${S.p}">
        Hi <strong style="color:#e8ecf4">${name}</strong>, your Hextorq account password has been updated.
      </p>
      <p style="${S.p}">
        If you made this change, you're all set. If not, please contact our support team immediately.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${BASE_URL}/login" style="${S.cta}">Sign In →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
    </div>
  `);
}

export function enquiryAdminNotification(name: string, email: string, phone: string | null, message: string, projectInfo: string) {
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">New lead captured</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">📩</div>
      </div>
      <h2 style="${S.h2}">New enquiry from ${name}</h2>
      <p style="${S.p}">A user has submitted an enquiry on Hextorq. Details below:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:12px;overflow:hidden">
        <tr>
          <td style="padding:10px 14px;background:rgba(109,91,208,0.06);border-bottom:1px solid #1e2340;color:#8b95b8;font-size:13px;font-weight:600;width:100px">Name</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e2340;color:#e8ecf4;font-size:13px">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:rgba(109,91,208,0.06);border-bottom:1px solid #1e2340;color:#8b95b8;font-size:13px;font-weight:600">Email</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e2340;color:#e8ecf4;font-size:13px"><a href="mailto:${email}" style="color:#a7b7e7">${email}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding:10px 14px;background:rgba(109,91,208,0.06);border-bottom:1px solid #1e2340;color:#8b95b8;font-size:13px;font-weight:600">Phone</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e2340;color:#e8ecf4;font-size:13px">${phone}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:10px 14px;background:rgba(109,91,208,0.06);border-bottom:1px solid #1e2340;color:#8b95b8;font-size:13px;font-weight:600">Project</td>
          <td style="padding:10px 14px;border-bottom:1px solid #1e2340;color:#e8ecf4;font-size:13px">${projectInfo}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:rgba(109,91,208,0.06);color:#8b95b8;font-size:13px;font-weight:600">Time</td>
          <td style="padding:10px 14px;color:#e8ecf4;font-size:13px">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
        </tr>
      </table>
      <div style="${S.highlight}">
        <p style="${S.highlightText}"><strong style="color:#e8ecf4;display:block;margin-bottom:4px">Message:</strong>${message}</p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="mailto:${email}" style="${S.cta}">Reply via Email →</a>
      </div>
    </div>
  `);
}

export function enquiryUserConfirmation(name: string, message: string) {
  return wrap(`
    <div class="header" style="${S.header}">
      <div style="${S.headerGlow}"></div>
      <div style="${S.logo}">Hextorq</div>
      <p style="${S.tagline}">Enquiry received</p>
    </div>
    <div class="content" style="${S.content}">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:8px;line-height:1">🙌</div>
      </div>
      <h2 style="${S.h2}">Thanks for reaching out, ${name}!</h2>
      <p style="${S.p}">
        We've received your enquiry and our team will review it shortly. Here's a copy of what you sent:
      </p>
      <div style="${S.highlight}">
        <p style="${S.highlightText}"><strong style="color:#e8ecf4;display:block;margin-bottom:4px">Your message:</strong>${message}</p>
      </div>
      <hr style="${S.divider}" />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
        <div style="${S.statBox}">
          <div style="${S.statValue}">⏱</div>
          <div style="${S.statLabel}">Response within 24h</div>
        </div>
        <div style="${S.statBox}">
          <div style="${S.statValue}">📱</div>
          <div style="${S.statLabel}">WhatsApp follow-up</div>
        </div>
      </div>
      <p style="${S.p}">
        <strong style="color:#e8ecf4">⏳ What happens next?</strong><br/>
        Our project engineers will review your requirements and reach out within 24 hours via WhatsApp or email to discuss next steps.
      </p>
      <p style="${S.p}">
        In the meantime, browse more projects or contact us on WhatsApp for faster support.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${BASE_URL}/explore" style="${S.cta}">Browse More Projects →</a>
      </div>
      <p style="${S.p};margin-bottom:0">— The Hextorq Team</p>
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
