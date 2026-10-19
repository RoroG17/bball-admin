import { animationDelay } from "@/lib/animationDelay";
import { formatPercentDecimal, formatShootingRatio, pluralize } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import type { ShootingTotals } from "@/models/StatTotals";

type ShootingTileProps = {
  label: string;
  totals: ShootingTotals;
  /** Rang de la tuile, pour la cascade des barres. */
  index: number;
};

/** Le texte « x réussis · y manqués » porte le sens ; la barre est décorative (P8, P13). */
export function ShootingTile({ label, totals, index }: ShootingTileProps) {
  const ratio = computeShootingPercentage(totals.made, totals.attempted);
  const missed = totals.attempted - totals.made;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border-2 border-rpb-ink/14 p-3.5">
      <h3 className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">{label}</h3>
      {ratio === null ? (
        <p className="text-[15px]/[22px] font-semibold text-rpb-ink/72">Aucune tentative</p>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display text-[26px] leading-none font-black tabular-nums">
              {formatPercentDecimal(ratio)}
            </span>
            <span className="text-[15px] font-semibold tabular-nums">
              {formatShootingRatio(totals.made, totals.attempted)}
            </span>
          </p>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-rpb-ink/8">
            {/* Largeur calculée : seul style inline avec les délais d'animation. */}
            <div
              className="bar-x h-full rounded-full bg-success"
              style={{ width: `${ratio * 100}%`, ...animationDelay(300 + index * 120) }}
            />
          </div>
          <p className="text-xs text-rpb-ink/72 tabular-nums">
            {pluralize(totals.made, "réussi", "réussis")} · {pluralize(missed, "manqué", "manqués")}
          </p>
        </>
      )}
    </div>
  );
}
