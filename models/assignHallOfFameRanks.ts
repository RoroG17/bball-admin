import { assignRanks } from "@/models/assignRanks";
import { compareHallOfFameEntries, type UnrankedEntry } from "@/models/compareHallOfFameEntries";
import type { HallOfFameEntry } from "@/models/HallOfFameEntry";
import { roundToDigits } from "@/models/roundToDigits";

/**
 * Trie, puis classe « en compétition » sur la valeur arrondie à l'affichage : `[72.64, 72.58, 70]` à 1 décimale
 * → rangs `1, 1, 3` (les deux premiers s'affichent « 72,6 »). La valeur brute est conservée. Ne tronque pas la liste.
 */
export function assignHallOfFameRanks(entries: readonly UnrankedEntry[], digits: 0 | 1): HallOfFameEntry[] {
  const sorted = [...entries].sort(compareHallOfFameEntries);
  const ranked = assignRanks(sorted.map((entry) => ({ ...entry, value: roundToDigits(entry.value, digits) })));
  return sorted.map((entry, index) => ({ rank: ranked[index].rank, player: entry.player, value: entry.value }));
}
