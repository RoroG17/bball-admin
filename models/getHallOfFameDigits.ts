import type { HallOfFameCategory } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";

/** Décimales affichées : pourcentages 1 partout ; volumes 0 (compteurs entiers) sauf les deux moyennes, 1. */
export function getHallOfFameDigits(category: HallOfFameCategory, mode: HallOfFameMode): 0 | 1 {
  if (category.kind === "percent") return 1;
  return mode === "averagePerGame" || mode === "averagePerSeason" ? 1 : 0;
}
