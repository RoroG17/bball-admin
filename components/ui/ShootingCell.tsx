import { cx } from "@/lib/cx";
import { formatPercentDecimal, formatShootingRatio } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import type { ShootingTotals } from "@/models/StatTotals";

type ShootingCellProps = {
  totals: ShootingTotals;
  /** Classes de la cellule (ligne de joueur ou ligne Total). */
  className?: string;
  /** Sur la ligne Total (fond bordeaux) : pourcentage en or clair, pas d'atténuation. */
  onDark?: boolean;
};

/** « 5/9 » et le pourcentage en dessous ; « — » sans tentative. */
export function ShootingCell({ totals, className, onDark = false }: ShootingCellProps) {
  const empty = totals.attempted === 0;
  return (
    <td className={className}>
      <span className="flex flex-col items-end">
        <span className={cx("font-semibold", empty && !onDark && "text-rpb-ink/72")}>
          {formatShootingRatio(totals.made, totals.attempted)}
        </span>
        <span className={cx("text-[11px]/[14px]", onDark ? "text-rpb-gold-light" : "text-rpb-ink/72")}>
          {formatPercentDecimal(computeShootingPercentage(totals.made, totals.attempted), 0)}
        </span>
      </span>
    </td>
  );
}
