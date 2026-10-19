import type { AdminGameRow } from "@/models/AdminGameRow";
import { compareGamesByDate } from "@/models/compareGamesByDate";

/** Ordre de départage de `sortRows` (toujours croissant) : date, journée, identifiant. */
export const compareAdminGameRows = (a: AdminGameRow, b: AdminGameRow): number => compareGamesByDate(a.entry.game, b.entry.game);

/** Comparateurs des colonnes triables ; `round` = journée, puis date, puis identifiant. */
export const GAME_COMPARATORS: Record<"date" | "round", (a: AdminGameRow, b: AdminGameRow) => number> = {
  date: compareAdminGameRows,
  round: (a, b) => a.entry.game.number - b.entry.game.number || compareGamesByDate(a.entry.game, b.entry.game),
};
