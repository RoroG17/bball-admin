import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/ApiError";
import { ValidationErrorDto } from "@/repositories/dto/ValidationErrorDto";
import type { WriteFailure, WriteResult } from "@/models/WriteFailure";

function readBackMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("message" in body)) return null;
  return typeof body.message === "string" ? body.message : null;
}

function classifyApiError(error: ApiError): WriteFailure {
  switch (error.status) {
    case 422: {
      const parsed = ValidationErrorDto.safeParse(error.body);
      return parsed.success ? { kind: "invalid", errors: parsed.data.errors } : { kind: "failed", reason: "server" };
    }
    case 404:
      return { kind: "notFound", backMessage: readBackMessage(error.body) };
    case 403:
      return { kind: "forbidden" };
    case 409:
      return { kind: "conflict" };
    default:
      return { kind: "failed", reason: "server" };
  }
}

/**
 * Exécute une écriture et convertit tout échec en `WriteFailure` : jamais d'exception métier. `redirect()`,
 * `notFound()` et `forbidden()` (dont le 401 → « session expirée ») sont relancés. Ne journalise rien : ni charge
 * utile, ni jeton.
 */
export async function runWrite<T>(call: () => Promise<T>): Promise<WriteResult<T>> {
  try {
    return { kind: "ok", value: await call() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) return classifyApiError(error);
    return { kind: "failed", reason: "network" };
  }
}
