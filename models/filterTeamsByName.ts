import { normalizeSearchText } from "@/models/normalizeSearchText";
import type { TeamListRow } from "@/models/TeamListRow";

/** Chaque mot de la recherche doit apparaître dans le nom (sans accents ni casse). Recherche vide : tout, même ordre. */
export function filterTeamsByName(rows: readonly TeamListRow[], query: string): TeamListRow[] {
  const words = normalizeSearchText(query).split(" ").filter(Boolean);
  if (words.length === 0) return [...rows];
  return rows.filter((row) => {
    const name = normalizeSearchText(row.team.name);
    return words.every((word) => name.includes(word));
  });
}
