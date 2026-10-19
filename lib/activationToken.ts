import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { ACTIVATION_MAX_AGE_SECONDS } from "@/lib/sessionCookie";

/** `purpose` littéral : un jeton de session n'est jamais accepté comme activation, et inversement. */
const ActivationTokenPayloadSchema = z.object({
  username: z.string().min(1),
  purpose: z.literal("activation"),
});

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signActivationToken(
  username: string,
  secret: string,
  expiresInSeconds = ACTIVATION_MAX_AGE_SECONDS,
): Promise<string> {
  return new SignJWT({ username, purpose: "activation" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key(secret));
}

/** Renvoie `null` si le jeton est absent, falsifié, expiré ou n'est pas un jeton d'activation. */
export async function verifyActivationToken(
  token: string | undefined,
  secret: string,
): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    const parsed = ActivationTokenPayloadSchema.safeParse(payload);
    return parsed.success ? { username: parsed.data.username } : null;
  } catch {
    return null;
  }
}
