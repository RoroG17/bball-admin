import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";

/** Après une création : l'édition de la saison (participants) avec `?notice=created` ; id illisible → la liste. */
export function buildSeasonCreatedHref(seasonId: number | null): string {
  if (seasonId === null) return buildAdminNoticeHref("season", { code: "created" });
  return appendAdminNotice(buildAdminHref("season", { kind: "edit", id: seasonId }), { code: "created" });
}
