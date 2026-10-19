import type { PeriodSelection } from "@/models/PeriodSelection";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { PlayerStatRow } from "@/models/PlayerStatRow";
import { selectPeriods } from "@/models/selectPeriods";
import { sumPeriodStats } from "@/models/sumPeriodStats";

type RowContext = { currentLicence: string | null; duplicateLicences: readonly string[] };

/** Une ligne par ligne de stats (doublons non fusionnés, D3), dans l'ordre d'entrée. */
export function buildPlayerStatRows(
  lines: readonly PlayerGameStats[],
  selection: PeriodSelection,
  { currentLicence, duplicateLicences }: RowContext,
): PlayerStatRow[] {
  return lines.map((line) => ({
    lineId: line.lineId,
    player: line.player,
    playingTimeSeconds: line.playingTimeSeconds,
    totals: sumPeriodStats(selectPeriods(line.periods, selection)),
    isCurrentUser: currentLicence !== null && line.player.licence === currentLicence,
    isDuplicate: duplicateLicences.includes(line.player.licence),
  }));
}
