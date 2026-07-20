import { OAuth2Client, type TokenPayload } from "google-auth-library";

// Google OAuth Client IDs are public identifiers, not secrets — hardcoded as a
// fallback so verification works even if the hosting platform's env vars aren't
// configured. GOOGLE_CLIENT_ID still overrides when set.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "919142469320-am40k8k0vs7gm034ht808d6csu4l7sdp.apps.googleusercontent.com";

export function isGoogleConfigured(): boolean {
  return !!CLIENT_ID;
}

export async function verifyGoogleToken(idToken: string): Promise<TokenPayload | undefined> {
  const client = new OAuth2Client(CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
  return ticket.getPayload();
}
