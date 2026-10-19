import { buildAdminHref } from "@/models/buildAdminHref";

/** Formulaire de création, saison de la liste d'origine présélectionnée. */
export function buildAdminGameCreateHref(seasonId: number | null): string {
  const base = buildAdminHref("game", "create");
  return seasonId === null ? base : `${base}?saison=${seasonId}`;
}
