import { sendMail } from "./mailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

async function safeSend(to: string, subject: string, html: string, text: string) {
  try {
    await sendMail({ to, subject, html, text });
  } catch (err) {
    console.error(`Failed to send referral email ("${subject}"):`, err);
  }
}

export async function sendReferralEarningNotification(
  referrerEmail: string,
  referrerName: string,
  referredEmail: string,
  projectTitle: string,
  amount: number
) {
  const html = `
    <p>Hi ${referrerName},</p>
    <p>Great news! Someone purchased a project through your referral link.</p>
    <p><strong>Referred:</strong> ${referredEmail}</p>
    <p><strong>Project:</strong> ${projectTitle}</p>
    <p><strong>Amount Credited:</strong> ₹${amount}</p>
    <p>This amount will be available for withdrawal after the order is delivered.</p>
    <p>— HexTorq Projects</p>
  `;
  const text = `Hi ${referrerName},\n\nSomeone purchased a project through your referral link.\n\nReferred: ${referredEmail}\nProject: ${projectTitle}\nAmount Credited: ₹${amount}\n\nThis amount will be available for withdrawal after the order is delivered.\n\n— HexTorq Projects`;

  await safeSend(referrerEmail, `You earned ₹${amount} from a referral!`, html, text);
}

export async function sendReferralWithdrawalRequestToAdmin(
  userName: string,
  userEmail: string,
  amount: number,
  upiId: string,
  upiHolderName: string
) {
  if (!ADMIN_EMAIL) return;

  const html = `
    <p>A new referral withdrawal request has been submitted.</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px">
      <tr><td><strong>User Name</strong></td><td>${userName}</td></tr>
      <tr><td><strong>User Email</strong></td><td>${userEmail}</td></tr>
      <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
      <tr><td><strong>UPI ID</strong></td><td>${upiId}</td></tr>
      <tr><td><strong>UPI Holder Name</strong></td><td>${upiHolderName}</td></tr>
    </table>
    <p><a href="${process.env.ADMIN_PANEL_URL || "http://localhost:5173"}/admin/referrals">Go to Admin Panel</a></p>
    <p>— HexTorq Projects</p>
  `;
  const text = `New Withdrawal Request\n\nUser: ${userName} (${userEmail})\nAmount: ₹${amount}\nUPI ID: ${upiId}\nHolder: ${upiHolderName}\n\nGo to admin panel to review.`;

  await safeSend(ADMIN_EMAIL, `Referral Withdrawal Request — ₹${amount} from ${userName}`, html, text);
}

export async function sendWithdrawalStatusUpdate(
  userEmail: string,
  userName: string,
  amount: number,
  status: string,
  adminNote: string | null
) {
  const approved = status === "APPROVED";
  const subject = approved
    ? `Your withdrawal of ₹${amount} has been processed`
    : `Your withdrawal of ₹${amount} was not approved`;

  const html = `
    <p>Hi ${userName},</p>
    ${approved
      ? `<p>Your withdrawal request for <strong>₹${amount}</strong> has been approved and the amount has been sent to your UPI.</p>`
      : `<p>Your withdrawal request for <strong>₹${amount}</strong> was not approved.</p>`
    }
    ${adminNote ? `<p><strong>Admin Note:</strong> ${adminNote}</p>` : ""}
    <p>— HexTorq Projects</p>
  `;
  const text = `Hi ${userName},\n\n${approved ? `Your withdrawal of ₹${amount} has been processed and sent to your UPI.` : `Your withdrawal of ₹${amount} was not approved.`}\n${adminNote ? `Admin Note: ${adminNote}\n` : ""}\n— HexTorq Projects`;

  await safeSend(userEmail, subject, html, text);
}
