import type { AdminListQuery } from "@/models/AdminListQuery";
import type { AdminNoticeCode } from "@/models/AdminNotice";
import { GAME_LIST_BASE_PATH, GAME_LIST_SPEC } from "@/models/adminGameListSpec";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminListHref } from "@/models/buildAdminListHref";

const DEFAULT_QUERY: AdminListQuery = { q: "", sort: GAME_LIST_SPEC.defaultSort, filters: {}, page: 1 };

/**
 * Liste des matchs d'une saison, forme canonique (`?saison=` d'abord), `notice` et `ref` en dernier (C8). Sert aux
 * redirections d'actions et aux liens « Annuler ». Sans saison : liste nue (la vue redirige vers la plus récente).
 */
export function buildAdminGameListHref(
  seasonId: number | null,
  query: Partial<AdminListQuery> = {},
  notice?: { code: AdminNoticeCode; ref?: string | number | null },
): string {
  if (seasonId === null) return notice ? appendAdminNotice(buildAdminHref("game"), notice) : buildAdminHref("game");
  const href = buildAdminListHref(
    GAME_LIST_BASE_PATH,
    { ...DEFAULT_QUERY, ...query, filters: { saison: String(seasonId) } },
    GAME_LIST_SPEC,
  );
  return notice ? appendAdminNotice(href, notice) : href;
}
