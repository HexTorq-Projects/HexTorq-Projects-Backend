import { OAuth2Client, type TokenPayload } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export function isGoogleConfigured(): boolean {
  return !!CLIENT_ID;
}

export async function verifyGoogleToken(idToken: string): Promise<TokenPayload | undefined> {
  const client = new OAuth2Client(CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
  return ticket.getPayload();
}
