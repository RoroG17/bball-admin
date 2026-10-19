import type { SortState } from "@/models/AdminListQuery";

/**
 * Copie triée (jamais de mutation). `desc` inverse le comparateur de la colonne, pas `tieBreak` (toujours croissant :
 * ordre déterministe). Colonne sans comparateur → `tieBreak` seul.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: SortState,
  comparators: Readonly<Record<string, (a: T, b: T) => number>>,
  tieBreak: (a: T, b: T) => number,
): T[] {
  const compare = Object.hasOwn(comparators, sort.column) ? comparators[sort.column] : undefined;
  const sign = sort.direction === "desc" ? -1 : 1;
  return rows.toSorted((a, b) => {
    const result = compare ? compare(a, b) * sign : 0;
    return result !== 0 ? result : tieBreak(a, b);
  });
}
