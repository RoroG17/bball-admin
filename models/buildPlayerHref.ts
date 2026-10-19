import { PLAYER_TAB_PARAMS, type PlayerTab } from "@/models/PlayerTab";

/**
 * Seul constructeur d'URL de fiche : `/player/{licence}?saison=…&onglet=…&periode=…`.
 * Statistiques (onglet par défaut) et valeurs vides sont omis : l'URL reste canonique.
 */
export function buildPlayerHref(
  licence: string,
  params: { saison?: string; onglet?: PlayerTab; periode?: string | null } = {},
): string {
  const query = new URLSearchParams();
  if (params.saison) query.set("saison", params.saison);
  if (params.onglet && params.onglet !== "statistics") query.set("onglet", PLAYER_TAB_PARAMS[params.onglet]);
  if (params.periode) query.set("periode", params.periode);
  const search = query.toString();
  return `/player/${encodeURIComponent(licence)}${search ? `?${search}` : ""}`;
}
