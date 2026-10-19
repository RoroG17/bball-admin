import type { SortState } from "@/models/AdminListQuery";
import { compareText } from "@/models/compareText";
import type { SeasonRow } from "@/models/SeasonRow";
import { sortRows } from "@/models/sortRows";

function teamName(row: SeasonRow): string | null {
  return row.team.kind === "named" ? row.team.name : null;
}

/** Tri par nom d'équipe ; les lignes sans nom restent en dernier quel que soit le sens (le tri `desc` inverse, on compense). */
function compareTeams(direction: 1 | -1) {
  return (a: SeasonRow, b: SeasonRow): number => {
    const left = teamName(a);
    const right = teamName(b);
    if (left === null || right === null) return left === right ? 0 : (left === null ? 1 : -1) * direction;
    return compareText(left, right);
  };
}

/** Tri de la liste. Ex æquo : récence décroissante (`startYear` puis `id`), donc ordre déterministe. Ne mute pas. */
export function sortSeasonRows(rows: readonly SeasonRow[], sort: SortState): SeasonRow[] {
  const direction = sort.direction === "desc" ? -1 : 1;
  return sortRows(
    rows,
    sort,
    {
      year: (a, b) => a.season.startYear - b.season.startYear || a.season.id - b.season.id,
      championship: (a, b) => compareText(a.season.championship, b.season.championship),
      category: (a, b) => compareText(a.season.category, b.season.category),
      team: compareTeams(direction),
    },
    (a, b) => b.season.startYear - a.season.startYear || b.season.id - a.season.id,
  );
}
