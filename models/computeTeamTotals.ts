import type { PeriodSelection } from "@/models/PeriodSelection";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import { selectPeriods } from "@/models/selectPeriods";
import type { StatTotals } from "@/models/StatTotals";
import { sumPeriodStats } from "@/models/sumPeriodStats";

/** Total de l'équipe sur la période choisie. Toutes les lignes comptent, doublons compris (D3). */
export function computeTeamTotals(lines: readonly PlayerGameStats[], selection: PeriodSelection): StatTotals {
  return sumPeriodStats(lines.flatMap((line) => selectPeriods(line.periods, selection)));
}
