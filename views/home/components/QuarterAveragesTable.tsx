import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { formatDecimal } from "@/lib/format";
import type { QuarterAverages } from "@/models/QuarterAverages";
import { sumQuarters } from "@/models/sumQuarters";
import { TEAM_STAT_LABELS, TEAM_STATS } from "@/models/TeamStat";

type QuarterAveragesTableProps = { averages: QuarterAverages };

const HEAD_CELL =
  "border-b-2 border-rpb-ink px-2.5 py-2 text-xs font-semibold tracking-[.06em] whitespace-nowrap uppercase";
const BODY_CELL = "border-b border-rpb-ink/12 px-2.5 py-2 text-sm";

/** Lecture principale des moyennes, et alternative accessible au graphique. */
export function QuarterAveragesTable({ averages }: QuarterAveragesTableProps) {
  return (
    <div className="min-w-0 flex-[2_1_360px] overflow-x-auto">
      <table className="w-full border-collapse tabular-nums">
        <caption className="pb-2 text-left text-[15px] font-bold">Toutes les statistiques</caption>
        <thead>
          <tr>
            <th scope="col" className={cx(HEAD_CELL, "text-left text-rpb-ink/72")}>
              Statistique
            </th>
            {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
              <th key={quarter} scope="col" className={cx(HEAD_CELL, "text-right text-rpb-ink/72")}>
                {quarter}
              </th>
            ))}
            <th scope="col" className={cx(HEAD_CELL, "text-right text-rpb-ink")}>
              Moy./match
            </th>
          </tr>
        </thead>
        <tbody>
          {TEAM_STATS.map((stat, index) => (
            <tr key={stat} className="row-in" style={animationDelay(250 + index * 60)}>
              <th scope="row" className={cx(BODY_CELL, "text-left font-medium whitespace-nowrap")}>
                {TEAM_STAT_LABELS[stat]}
              </th>
              {averages[stat].map((value, quarter) => (
                <td key={quarter} className={cx(BODY_CELL, "text-right")}>
                  {formatDecimal(value)}
                </td>
              ))}
              <td className={cx(BODY_CELL, "bg-rpb-gold-light text-right font-extrabold")}>
                {formatDecimal(sumQuarters(averages[stat]))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
