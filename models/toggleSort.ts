import type { SortState } from "@/models/AdminListQuery";

/** Même colonne : inverse la direction ; autre colonne : croissant. */
export function toggleSort(current: SortState, column: string): SortState {
  if (current.column === column) return { column, direction: current.direction === "asc" ? "desc" : "asc" };
  return { column, direction: "asc" };
}
