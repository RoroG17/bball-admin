import type { AdminGameRow } from "@/models/AdminGameRow";
import { normalizeSearchText } from "@/models/normalizeSearchText";

/** Chaque mot de la recherche doit figurer dans « domicile extérieur » (accents et casse ignorés). */
export function filterAdminGameRows(rows: readonly AdminGameRow[], query: string): AdminGameRow[] {
  const words = normalizeSearchText(query)
    .split(" ")
    .filter((word) => word !== "");
  if (words.length === 0) return [...rows];
  return rows.filter(({ entry }) => {
    const haystack = normalizeSearchText(`${entry.game.home.name} ${entry.game.away.name}`);
    return words.every((word) => haystack.includes(word));
  });
}
