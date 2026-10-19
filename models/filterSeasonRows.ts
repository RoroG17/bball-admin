import { normalizeSearchText } from "@/models/normalizeSearchText";
import type { SeasonRow } from "@/models/SeasonRow";

/** Chaque mot de la recherche doit figurer dans « années championnat catégorie équipe » (accents et casse ignorés). */
export function filterSeasonRows(rows: readonly SeasonRow[], query: string): SeasonRow[] {
  const words = normalizeSearchText(query)
    .split(" ")
    .filter((word) => word !== "");
  if (words.length === 0) return [...rows];
  return rows.filter(({ season, team }) => {
    const teamName = team.kind === "named" ? team.name : "";
    const haystack = normalizeSearchText(
      `${season.startYear}-${season.endYear} ${season.startYear} ${season.endYear} ${season.championship} ${season.category} ${teamName}`,
    );
    return words.every((word) => haystack.includes(word));
  });
}
