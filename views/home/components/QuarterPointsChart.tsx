import { CountUp } from "@/components/ui/CountUp";
import { animationDelay } from "@/lib/animationDelay";
import { cx } from "@/lib/cx";
import { formatDecimal } from "@/lib/format";
import { computeBarHeight } from "@/models/computeBarHeight";
import { computeChartScale } from "@/models/computeChartScale";
import { describeQuarterPoints } from "@/models/describeQuarterPoints";
import { formatQuarterList } from "@/models/formatQuarterList";
import { getBestQuarters } from "@/models/getBestQuarters";
import type { QuarterValues } from "@/models/QuarterAverages";
import { sumQuarters } from "@/models/sumQuarters";

type QuarterPointsChartProps = { points: QuarterValues };

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];

/** Points marqués par quart-temps, séparés des autres stats pour garder une échelle lisible. */
export function QuarterPointsChart({ points }: QuarterPointsChartProps) {
  const scale = computeChartScale(points);
  const best = getBestQuarters(points);

  return (
    <figure className="m-0 flex flex-[1_1_240px] flex-col gap-2.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-bold">Points marqués</span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-[26px] font-black tabular-nums">
            <CountUp value={sumQuarters(points)} kind="decimal" />
          </span>
          <span className="text-[13px] text-rpb-ink/72">pts / match</span>
        </span>
      </figcaption>
      <div
        role="img"
        aria-label={describeQuarterPoints(points, best)}
        className="flex h-[170px] items-end gap-3.5 border-b-2 border-rpb-ink px-1"
      >
        {points.map((value, index) => (
          <div key={QUARTER_LABELS[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-sm font-bold tabular-nums">{formatDecimal(value)}</span>
            {/* Hauteur calculée : seul style inline avec les délais d'animation. */}
            <div
              className={cx("bar w-full max-w-14 rounded-t", best.includes(index) ? "bg-rpb-red" : "bg-rpb-bordeaux")}
              style={{ height: `${computeBarHeight(value, scale)}px`, ...animationDelay(200 + index * 120) }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex gap-3.5 px-1">
        {QUARTER_LABELS.map((label) => (
          <span key={label} className="flex-1 text-center text-[13px] font-semibold">
            {label}
          </span>
        ))}
      </div>
      {best.length > 0 && (
        <p className="flex items-center gap-1.5 text-[13px]">
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-rpb-red" />
          {best.length > 1 ? "Meilleurs quarts-temps" : "Meilleur quart-temps"} : {formatQuarterList(best)}
        </p>
      )}
    </figure>
  );
}
