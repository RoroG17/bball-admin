import type { Game } from "@/models/Game";

/** Ordre chronologique croissant : date, puis journée, puis identifiant. */
export function compareGamesByDate(a: Game, b: Game): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.number !== b.number) return a.number - b.number;
  return a.id - b.id;
}
