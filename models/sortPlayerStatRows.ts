import type { PlayerStatSortKey, SortDirection } from "@/models/playerStatColumns";
import type { PlayerStatRow } from "@/models/PlayerStatRow";

const collator = new Intl.Collator("fr", { sensitivity: "base" });

const compareNames = (a: PlayerStatRow, b: PlayerStatRow) =>
  collator.compare(a.player.lastName, b.player.lastName) || collator.compare(a.player.firstName, b.player.firstName);

const tieBreak = (a: PlayerStatRow, b: PlayerStatRow) => compareNames(a, b) || a.lineId - b.lineId;

function compareValues(a: PlayerStatRow, b: PlayerStatRow, key: Exclude<PlayerStatSortKey, "name" | "minutes">) {
  const left = a.totals[key];
  const right = b.totals[key];
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "object" && typeof right === "object") {
    return left.made - right.made || left.attempted - right.attempted;
  }
  return 0;
}

/**
 * Tri de la feuille. Minutes inconnues toujours en dernier, quel que soit le sens.
 * Égalité → nom croissant puis `lineId` (ordre stable). Ne mute pas l'entrée.
 */
export function sortPlayerStatRows(
  rows: readonly PlayerStatRow[],
  key: PlayerStatSortKey,
  direction: SortDirection,
): PlayerStatRow[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "name") return sign * compareNames(a, b) || a.lineId - b.lineId;
    if (key === "minutes") {
      if (a.playingTimeSeconds === null || b.playingTimeSeconds === null) {
        if (a.playingTimeSeconds === b.playingTimeSeconds) return tieBreak(a, b);
        return a.playingTimeSeconds === null ? 1 : -1;
      }
      return sign * (a.playingTimeSeconds - b.playingTimeSeconds) || tieBreak(a, b);
    }
    return sign * compareValues(a, b, key) || tieBreak(a, b);
  });
}
