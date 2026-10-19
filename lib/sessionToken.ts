import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/sessionCookie";

export const SessionTokenPayloadSchema = z.object({
  username: z.string().min(1),
  licence: z.string().min(1).nullable(),
  token: z.string().min(1),
});
export type SessionTokenPayload = z.infer<typeof SessionTokenPayloadSchema>;

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  secret: string,
  expiresInSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key(secret));
}

/** Renvoie `null` si le jeton est absent, falsifié, expiré ou mal formé. */
export async function verifySessionToken(token: string | undefined, secret: string): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    const parsed = SessionTokenPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
