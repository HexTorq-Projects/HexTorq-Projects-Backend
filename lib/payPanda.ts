const REQUIRED_KEYS = ["PAY_PANDA_APP_ID", "PAY_PANDA_APP_SECRET"] as const;

export function isPayPandaConfigured() {
  return REQUIRED_KEYS.every((key) => Boolean(process.env[key]));
}

export async function getPayPandaClient() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Pay-Panda environment variables: ${missing.join(", ")}`);
  }

  const { PayPanda } = await import("pay-panda-js");
  return new PayPanda({
    appId: process.env.PAY_PANDA_APP_ID!,
    appSecret: process.env.PAY_PANDA_APP_SECRET!,
    apiBase: process.env.PAY_PANDA_API_BASE,
  });
}

export function buildPaymentRedirectUrl() {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  return `${frontendUrl}/payment/callback`;
}
