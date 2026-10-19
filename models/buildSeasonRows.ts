import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import type { Season } from "@/models/Season";
import type { SeasonRow, SeasonTeamCellData } from "@/models/SeasonRow";
import type { TeamsResolution } from "@/models/TeamsResolution";

function toTeamCell(season: Season, teams: TeamsResolution): SeasonTeamCellData {
  if (season.teamId === null) return { kind: "none" };
  if (teams.kind === "unavailable") return { kind: "unavailable", id: season.teamId };
  const team = teams.teams.find((candidate) => candidate.id === season.teamId);
  return team ? { kind: "named", name: team.name, logoUrl: team.logoUrl } : { kind: "unknown", id: season.teamId };
}

/** Lignes de la liste. `isMostRecent` suit la règle existante de la saison par défaut (D-S2). Ne trie pas. */
export function buildSeasonRows(seasons: readonly Season[], teams: TeamsResolution): SeasonRow[] {
  const mostRecentId = resolveSelectedSeason(seasons, undefined)?.id;
  return seasons.map((season) => ({
    season,
    label: formatSeasonLabel(season),
    team: toTeamCell(season, teams),
    isMostRecent: season.id === mostRecentId,
  }));
}
