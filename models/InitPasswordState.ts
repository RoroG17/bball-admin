import type { InitPasswordField } from "@/models/InitPasswordInput";

/** Pas de `values` : on ne renvoie jamais un mot de passe. Le succès redirige. */
export type InitPasswordState =
  | { status: "idle" }
  | { status: "error"; message: string | null; fieldErrors: Partial<Record<InitPasswordField, string>> };
