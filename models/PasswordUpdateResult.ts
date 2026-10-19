/** Résultat métier de `POST /update`. */
export type PasswordUpdateResult =
  | { kind: "ok" }
  | { kind: "notFound" }
  | { kind: "invalid"; message: string | null }
  | { kind: "tooManyAttempts" }
  | { kind: "unavailable" };
