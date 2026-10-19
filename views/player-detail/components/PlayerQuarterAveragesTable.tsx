import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { formatDecimal } from "@/lib/format";
import type { PeriodAverages } from "@/models/computeGameLogPeriodAverages";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import { getTeamStatValue } from "@/models/getTeamStatValue";
import type { StatTotals } from "@/models/StatTotals";
import { TEAM_STAT_LABELS, TEAM_STATS } from "@/models/TeamStat";

type PlayerQuarterAveragesTableProps = { rows: PeriodAverages[]; overall: StatTotals };

const HEAD_CELL =
  "border-b-2 border-rpb-ink px-2.5 py-2 text-xs font-semibold tracking-[.06em] whitespace-nowrap uppercase";
const BODY_CELL = "border-b border-rpb-ink/12 px-2.5 py-2 text-sm";

/** Lecture principale des moyennes par période, et alternative à l'histogramme. */
export function PlayerQuarterAveragesTable({ rows, overall }: PlayerQuarterAveragesTableProps) {
  return (
    <div className="relative min-w-0 flex-[2_1_360px] overflow-x-auto">
      <table className="w-full border-collapse tabular-nums">
        <caption className="pb-2 text-left text-[15px] font-bold">Toutes les statistiques</caption>
        <thead>
          <tr>
            <th scope="col" className={cx(HEAD_CELL, "text-left text-rpb-ink/72")}>
              Statistique
            </th>
            {rows.map(({ period }) => (
              <th key={period} scope="col" className={cx(HEAD_CELL, "text-right text-rpb-ink/72")}>
                <span aria-hidden="true">{formatPeriodLabel(period)}</span>
                <span className="sr-only">{formatPeriodLabel(period, "long")}</span>
              </th>
            ))}
            <th scope="col" className={cx(HEAD_CELL, "text-right text-rpb-ink")}>
              Match
            </th>
          </tr>
        </thead>
        <tbody>
          {TEAM_STATS.map((stat, index) => (
            <tr key={stat} className="row-in" style={animationDelay(250 + index * 60)}>
              <th scope="row" className={cx(BODY_CELL, "text-left font-medium whitespace-nowrap")}>
                {TEAM_STAT_LABELS[stat]}
              </th>
              {rows.map(({ period, averages }) => (
                <td key={period} className={cx(BODY_CELL, "text-right")}>
                  {formatDecimal(getTeamStatValue(averages, stat), 1)}
                </td>
              ))}
              <td className={cx(BODY_CELL, "bg-rpb-gold-light text-right font-extrabold")}>
                {formatDecimal(getTeamStatValue(overall, stat), 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
