import "server-only";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/ApiError";
import { redirectToSessionExpired } from "@/lib/redirectToSessionExpired";

const TIMEOUT_MS = 10_000;

type ApiGetOptions = {
  token?: string;
  /**
   * Cache serveur opt-in (`force-cache` + `revalidate` + tags). Sans cette option, ou avec `seconds` à 0, la requête
   * n'est jamais mise en cache. L'en-tête `Authorization` fait une entrée de cache par jeton.
   */
  revalidate?: { seconds: number; tags: readonly string[] };
};

/**
 * Un 401 alors qu'un jeton a été envoyé = session refusée par le back : retour à la connexion (D9). Sans jeton, ou
 * pour toute autre erreur (réseau, 5xx), on ne déconnecte jamais (P6).
 */
async function handleUnauthorized(res: Response, token: string | undefined): Promise<void> {
  if (res.status === 401 && token) await redirectToSessionExpired();
}

export async function apiGet(path: string, { token, revalidate }: ApiGetOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit =
    revalidate && revalidate.seconds > 0
      ? { cache: "force-cache", next: { revalidate: revalidate.seconds, tags: [...revalidate.tags] }, headers }
      : { cache: "no-store", headers };
  const res = await fetch(new URL(path, env.BBALL_API_URL), init);
  if (!res.ok) {
    await handleUnauthorized(res, token);
    throw new ApiError(res.status, path);
  }
  return res.json();
}

/**
 * Écriture JSON authentifiée (`POST` / `PUT` / `DELETE`). `Accept: application/json` est indispensable : sans lui,
 * Laravel répond à une erreur de validation par une redirection au lieu d'un 422 JSON. `Content-Type` n'est envoyé
 * qu'avec un corps. Aucun jeton CSRF : l'appel part du serveur Next vers le back. Non-2xx → `ApiError` avec le corps
 * JSON s'il existe ; 2xx → corps JSON, ou `undefined` s'il est vide ou non JSON (le back répond 200 sans 204).
 */
async function sendJson(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body: unknown,
  token: string,
): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(new URL(path, env.BBALL_API_URL), {
    method,
    cache: "no-store",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    await handleUnauthorized(res, token);
    const errorBody: unknown = await res.json().catch(() => undefined);
    throw new ApiError(res.status, path, errorBody);
  }
  return res.json().catch(() => undefined);
}

/** `POST` JSON authentifié (délai de 10 s). */
export async function apiPost(path: string, body: unknown, { token }: { token: string }): Promise<unknown> {
  return sendJson("POST", path, body, token);
}

/** `PUT` JSON authentifié (délai de 10 s). */
export async function apiPut(path: string, body: unknown, { token }: { token: string }): Promise<unknown> {
  return sendJson("PUT", path, body, token);
}

/** `DELETE` authentifié, corps JSON optionnel (`/api/participer` lit son couple d'identifiants dans le corps). */
export async function apiDelete(path: string, { token, body }: { token: string; body?: unknown }): Promise<unknown> {
  return sendJson("DELETE", path, body, token);
}

/**
 * `POST` JSON qui ne lève pas sur un statut HTTP : l'authentification lit 201 / 400 / 401 / 404 / 422 / 429. Pas de
 * redirection sur 401 (un 401 de `/connect` = mauvais mot de passe). `body` = JSON parsé, `undefined` si non JSON.
 * Lève seulement sur erreur réseau ou délai dépassé (10 s).
 */
export async function apiPostWithStatus(
  path: string,
  body: unknown,
  { token }: { token?: string } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(new URL(path, env.BBALL_API_URL), {
    method: "POST",
    cache: "no-store",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const responseBody: unknown = await res.json().catch(() => undefined);
  return { status: res.status, body: responseBody };
}
