import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { computeBarHeight } from "@/models/computeBarHeight";
import { computeChartScale } from "@/models/computeChartScale";
import type { TeamPeriodTotals } from "@/models/computeTeamPeriodTotals";
import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import { formatPeriodList } from "@/models/formatPeriodList";
import { getBestQuarters } from "@/models/getBestQuarters";
import type { StatTotals } from "@/models/StatTotals";

type TeamPeriodPointsChartProps = { perPeriod: TeamPeriodTotals[]; total: StatTotals };

/**
 * Points marqués par période (même lecture que l'accueil). Décoratif : le tableau voisin porte les valeurs.
 * « Offensif » : sans les points adverses, on ne sait pas quel quart-temps a été gagné (P7).
 */
export function TeamPeriodPointsChart({ perPeriod, total }: TeamPeriodPointsChartProps) {
  const points = perPeriod.map(({ totals }) => totals.points);
  const scale = computeChartScale(points);
  const best = getBestQuarters(points).map((index) => perPeriod[index].period);

  return (
    <figure className="m-0 flex min-w-0 flex-[1_1_240px] flex-col gap-2.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-bold">Points marqués</span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-[26px] font-black tabular-nums">{total.points}</span>
          <span className="text-[13px] text-rpb-ink/72">pts</span>
        </span>
      </figcaption>
      <div aria-hidden="true" className="flex h-[170px] items-end gap-3.5 border-b-2 border-rpb-ink px-1">
        {perPeriod.map(({ period, totals }, index) => (
          <div key={period} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-sm font-bold tabular-nums">{totals.points}</span>
            {/* Hauteur calculée : seul style inline avec les délais d'animation. */}
            <div
              className={cx("bar w-full max-w-14 rounded-t", best.includes(period) ? "bg-rpb-red" : "bg-rpb-bordeaux")}
              style={{ height: `${computeBarHeight(totals.points, scale)}px`, ...animationDelay(200 + index * 120) }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex gap-3.5 px-1">
        {perPeriod.map(({ period }) => (
          <span key={period} className="flex-1 text-center text-[13px] font-semibold">
            {formatPeriodLabel(period)}
          </span>
        ))}
      </div>
      {best.length > 0 && (
        <p className="flex items-center gap-1.5 text-[13px]">
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-rpb-red" />
          {best.length > 1 ? "Meilleurs quarts-temps offensifs" : "Meilleur quart-temps offensif"} :{" "}
          {formatPeriodList(best)}
        </p>
      )}
    </figure>
  );
}
