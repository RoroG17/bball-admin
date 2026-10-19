import { LOGIN_REASONS, type LoginReason } from "@/models/LoginReason";

/** Valeur exacte de la liste, sinon `null` : aucun texte venant de l'URL n'est affiché. */
export function parseLoginReason(raw: string | undefined): LoginReason | null {
  return (LOGIN_REASONS as readonly string[]).includes(raw ?? "") ? (raw as LoginReason) : null;
}
