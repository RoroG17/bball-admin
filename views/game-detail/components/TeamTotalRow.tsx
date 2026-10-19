import { cx } from "@/lib/cx";
import type { StatTotals } from "@/models/StatTotals";
import { ShootingCell } from "@/components/ui/ShootingCell";

type TeamTotalRowProps = { totals: StatTotals; showMinutes: boolean };

const CELL =
  "border-t-2 border-rpb-ink bg-rpb-bordeaux px-2 py-3 text-right text-[15px]/5 font-bold whitespace-nowrap text-rpb-cream";
const COUNTERS = ["rebounds", "assists", "steals", "blocks", "turnovers", "fouls"] as const;

/** Ligne « Total équipe » : toutes les lignes, doublons compris (D3). Minutes sans objet. */
export function TeamTotalRow({ totals, showMinutes }: TeamTotalRowProps) {
  return (
    <tr>
      <th scope="row" className={cx(CELL, "sticky left-0 z-[1] min-w-[168px] pl-3 text-left")}>
        Total équipe
      </th>
      {showMinutes && <td className={CELL}>—</td>}
      <td className={cx(CELL, "font-display text-lg font-black text-rpb-gold")}>{totals.points}</td>
      {COUNTERS.map((key) => (
        <td key={key} className={CELL}>
          {totals[key]}
        </td>
      ))}
      <ShootingCell totals={totals.twoPoints} className={cx(CELL, "border-l-2 border-l-rpb-cream/22")} onDark />
      <ShootingCell totals={totals.threePoints} className={CELL} onDark />
      <ShootingCell totals={totals.freeThrows} className={CELL} onDark />
    </tr>
  );
}
