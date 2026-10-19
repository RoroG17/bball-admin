import type { AuthenticatedUser } from "@/models/AuthenticatedUser";

/** Résultat métier de `POST /connect` : jamais de statut HTTP brut hors du repository. */
export type AuthResult =
  | { kind: "authenticated"; user: AuthenticatedUser; token: string }
  | { kind: "passwordNotSet" }
  | { kind: "invalidCredentials" }
  | { kind: "tooManyAttempts" }
  | { kind: "unavailable" };
