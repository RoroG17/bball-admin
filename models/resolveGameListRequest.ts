import type { AdminListQuery, RawSearchParams } from "@/models/AdminListQuery";
import { GAME_LIST_BASE_PATH, GAME_LIST_SPEC } from "@/models/adminGameListSpec";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { parseAdminNotice } from "@/models/parseAdminNotice";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import type { Season } from "@/models/Season";

/**
 * Interprète l'URL de la liste : saison demandée (la plus récente par défaut) et forme canonique. Un seul saut :
 * `redirectTo` appliqué, la requête suivante renvoie `null`. Aucune saison : `season` nul, pas de redirection.
 */
export function resolveGameListRequest(
  raw: RawSearchParams,
  seasons: readonly Season[],
): { query: AdminListQuery; season: Season | null; redirectTo: string | null } {
  const base = resolveAdminListQuery(GAME_LIST_BASE_PATH, raw, GAME_LIST_SPEC);
  const season = resolveSelectedSeason(seasons, base.query.filters.saison);
  if (season === null) return { query: base.query, season: null, redirectTo: null };

  const query: AdminListQuery = { ...base.query, filters: { saison: String(season.id) } };
  const needsRedirect = base.redirectTo !== null || base.query.filters.saison !== String(season.id);
  return {
    query,
    season,
    redirectTo: needsRedirect ? buildAdminGameListHref(season.id, query, parseAdminNotice(raw) ?? undefined) : null,
  };
}
