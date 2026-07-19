import { sendMail } from "./mailer";

type PaymentPurpose = "FULL" | "ADVANCE" | "BALANCE";

interface EmailOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  items: { projectTitleSnapshot: string; unitPrice: number }[];
}

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function itemsHtml(items: EmailOrder["items"]) {
  return `<ul>${items.map((i) => `<li>${i.projectTitleSnapshot} — ${inr(i.unitPrice)}</li>`).join("")}</ul>`;
}
function itemsText(items: EmailOrder["items"]) {
  return items.map((i) => `- ${i.projectTitleSnapshot} (${inr(i.unitPrice)})`).join("\n");
}

/** Fire-and-forget: never throws, so a mail failure never breaks the checkout/verify request. */
async function safeSend(to: string, subject: string, html: string, text: string) {
  try {
    await sendMail({ to, subject, html, text });
  } catch (err) {
    console.error(`Failed to send order email ("${subject}"):`, err);
  }
}

export async function sendCheckoutCreatedEmail(
  order: EmailOrder,
  checkoutUrl: string,
  purpose: PaymentPurpose,
  amount: number
) {
  const subject =
    purpose === "ADVANCE"
      ? `Complete your pre-booking payment — Order ${order.orderNumber}`
      : purpose === "BALANCE"
      ? `Complete your balance payment — Order ${order.orderNumber}`
      : `Complete your payment — Order ${order.orderNumber}`;

  const intro =
    purpose === "ADVANCE"
      ? `To pre-book your project, pay the advance amount of ${inr(amount)} now. The remaining ${inr(
          order.totalAmount - amount
        )} will be due later.`
      : purpose === "BALANCE"
      ? `Please pay the remaining balance of ${inr(amount)} to complete Order ${order.orderNumber}.`
      : `Please complete payment of ${inr(amount)} to confirm Order ${order.orderNumber}.`;

  const html = `
    <p>Hi ${order.customerName},</p>
    <p>${intro}</p>
    ${itemsHtml(order.items)}
    <p><a href="${checkoutUrl}">Click here to pay</a></p>
    <p>— HexTorq Projects</p>
  `;
  const text = `Hi ${order.customerName},\n\n${intro}\n\n${itemsText(order.items)}\n\nPay here: ${checkoutUrl}\n\n— HexTorq Projects`;

  await safeSend(order.customerEmail, subject, html, text);
}

export async function sendPaymentResultEmail(order: EmailOrder, purpose: PaymentPurpose, resultStatus: string) {
  let subject: string;
  let intro: string;

  if (resultStatus === "SUCCESS" && order.status === "PAID") {
    subject = `Order Confirmed — ${order.orderNumber}`;
    intro = `Your payment of ${inr(order.amountPaid)} was received. Your order is fully paid and confirmed.`;
  } else if (resultStatus === "SUCCESS" && order.status === "BOOKED") {
    subject = `Booking Confirmed — ${order.orderNumber}`;
    intro = `Your advance payment was received and your project is booked. A balance of ${inr(
      order.balanceDue
    )} remains — you can pay it anytime from your Orders page.`;
  } else if (resultStatus === "FAILED" || resultStatus === "EXPIRED") {
    subject = `Payment ${resultStatus === "FAILED" ? "Failed" : "Expired"} — ${order.orderNumber}`;
    intro = `Your ${purpose.toLowerCase()} payment for Order ${order.orderNumber} could not be completed (${resultStatus.toLowerCase()}). Please retry from your Orders page.`;
  } else {
    return;
  }

  const html = `
    <p>Hi ${order.customerName},</p>
    <p>${intro}</p>
    ${itemsHtml(order.items)}
    <p>Order total: ${inr(order.totalAmount)}</p>
    <p>— HexTorq Projects</p>
  `;
  const text = `Hi ${order.customerName},\n\n${intro}\n\n${itemsText(order.items)}\n\nOrder total: ${inr(
    order.totalAmount
  )}\n\n— HexTorq Projects`;

  await safeSend(order.customerEmail, subject, html, text);
}
