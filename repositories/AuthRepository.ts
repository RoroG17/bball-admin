import "server-only";
import { apiPostWithStatus } from "@/lib/http";
import type { AuthResult } from "@/models/AuthResult";
import type { PasswordUpdateResult } from "@/models/PasswordUpdateResult";
import { ConnectSuccessDto } from "@/repositories/dto/AuthDto";
import { ValidationErrorDto } from "@/repositories/dto/ValidationErrorDto";

type RawResponse = { status: number; body: unknown };

/** Erreur réseau ou délai dépassé → `null` : l'appelant la traduit en `unavailable`. Ne lève jamais. */
async function post(path: string, body: unknown): Promise<RawResponse | null> {
  try {
    return await apiPostWithStatus(path, body);
  } catch {
    return null;
  }
}

/**
 * `POST /connect` (routes web, sans CSRF ni Sanctum côté back). Ne lève jamais.
 * 400, 401 et 404 donnent le même résultat : on ne révèle pas si le compte existe (P7, D15).
 */
export async function authenticate(username: string, password?: string): Promise<AuthResult> {
  const response = await post("/connect", password === undefined ? { username } : { username, password });
  if (!response) return { kind: "unavailable" };

  switch (response.status) {
    case 200: {
      const parsed = ConnectSuccessDto.safeParse(response.body);
      if (!parsed.success) return { kind: "unavailable" };
      const { user, token } = parsed.data;
      return {
        kind: "authenticated",
        user: { username: user.username, licence: user.joueur?.trim() || null },
        token,
      };
    }
    case 201:
      return { kind: "passwordNotSet" };
    case 400:
    case 401:
    case 404:
      return { kind: "invalidCredentials" };
    case 429:
      return { kind: "tooManyAttempts" };
    default:
      return { kind: "unavailable" };
  }
}

/**
 * `POST /update`. ⚠️ Le back n'exige aucune authentification et écrase n'importe quel mot de passe (S2, B2) :
 * n'appeler qu'après avoir vérifié que le compte est encore sans mot de passe. Ne lève jamais.
 */
export async function setPassword(username: string, password: string): Promise<PasswordUpdateResult> {
  const response = await post("/update", { username, password });
  if (!response) return { kind: "unavailable" };

  switch (response.status) {
    case 200:
      return { kind: "ok" };
    case 404:
      return { kind: "notFound" };
    case 422: {
      const parsed = ValidationErrorDto.safeParse(response.body);
      return { kind: "invalid", message: parsed.success ? (parsed.data.errors.password?.[0] ?? null) : null };
    }
    case 429:
      return { kind: "tooManyAttempts" };
    default:
      return { kind: "unavailable" };
  }
}
