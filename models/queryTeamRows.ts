import type { AdminListQuery } from "@/models/AdminListQuery";
import { compareText } from "@/models/compareText";
import { filterTeamsByName } from "@/models/filterTeamsByName";
import { sortRows } from "@/models/sortRows";
import type { TeamListRow } from "@/models/TeamListRow";

/** Différence numérique ; `null` en dernier quel que soit le sens (le tri `desc` inverse, donc on compense). */
function compareNullable(a: number | null, b: number | null, direction: 1 | -1): number {
  if (a === null || b === null) return a === b ? 0 : (a === null ? 1 : -1) * direction;
  return a - b;
}

function clubValue(row: TeamListRow): number | null {
  return row.clubSeasons === null ? null : Number(row.clubSeasons.length > 0);
}

/** Recherche par nom, filtre `type`, puis tri. Ignore `page` (pas de pagination). Ne mute pas l'entrée. */
export function queryTeamRows(rows: readonly TeamListRow[], query: AdminListQuery): TeamListRow[] {
  const type = query.filters.type;
  const filtered = filterTeamsByName(rows, query.q).filter((row) => {
    if (type === "club") return row.clubSeasons !== null && row.clubSeasons.length > 0;
    if (type === "other") return row.clubSeasons !== null && row.clubSeasons.length === 0;
    return true;
  });
  const direction = query.sort.direction === "desc" ? -1 : 1;
  return sortRows(
    filtered,
    query.sort,
    {
      name: (a, b) => compareText(a.team.name, b.team.name),
      players: (a, b) => compareNullable(a.playerCount, b.playerCount, direction),
      club: (a, b) => compareNullable(clubValue(a), clubValue(b), direction),
    },
    (a, b) => compareText(a.team.name, b.team.name) || a.team.id - b.team.id,
  );
}
