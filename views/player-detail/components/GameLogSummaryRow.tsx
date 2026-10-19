import { ShootingCell } from "@/components/ui/ShootingCell";
import { cx } from "@/lib/cx";
import { formatDecimal, formatPercentDecimal, formatPlayingTime } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import type { ShootingTotals, StatTotals } from "@/models/StatTotals";

type GameLogSummaryRowProps = {
  label: string;
  totals: StatTotals;
  /** `average` : décimales et pourcentages ; `total` : entiers et ratios. */
  kind: "average" | "total";
  /** Temps de jeu moyen en secondes (ligne `average` seulement). */
  minutes: number | null;
  showMinutes: boolean;
};

const COUNTERS = ["rebounds", "assists", "steals", "blocks", "turnovers", "fouls"] as const;

/** Pied du journal : deux lignes bordeaux, Moyenne puis Total (DS52). */
export function GameLogSummaryRow({ label, totals, kind, minutes, showMinutes }: GameLogSummaryRowProps) {
  const isAverage = kind === "average";
  const cell = cx(
    "bg-rpb-bordeaux px-2 py-3 text-right text-[15px]/5 font-bold whitespace-nowrap text-rpb-cream",
    isAverage ? "border-t-2 border-rpb-ink" : "border-t border-rpb-cream/22",
  );
  const value = (n: number) => (isAverage ? formatDecimal(n, 1) : n);
  const shooting = (totals: ShootingTotals, extra?: string) =>
    isAverage ? (
      <td className={cx(cell, extra)}>
        {formatPercentDecimal(computeShootingPercentage(totals.made, totals.attempted))}
      </td>
    ) : (
      <ShootingCell totals={totals} className={cx(cell, extra)} onDark />
    );

  return (
    <tr>
      <th scope="row" className={cx(cell, "sticky left-0 z-[1] min-w-[120px] pl-3 text-left leading-[18px] whitespace-normal")}>
        {label}
      </th>
      <td className={cell} />
      <td className={cell} />
      {showMinutes && <td className={cell}>{isAverage ? formatPlayingTime(minutes) : "—"}</td>}
      <td className={cx(cell, "font-display text-lg font-black text-rpb-gold")}>{value(totals.points)}</td>
      {COUNTERS.map((key) => (
        <td key={key} className={cell}>
          {value(totals[key])}
        </td>
      ))}
      {shooting(totals.twoPoints, "border-l-2 border-l-rpb-cream/22")}
      {shooting(totals.threePoints)}
      {shooting(totals.freeThrows)}
    </tr>
  );
}
