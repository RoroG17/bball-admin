import { useId } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { computeDonutArcs, DONUT_RADIUS } from "@/models/computeDonutArcs";
import type { SeasonRecord } from "@/models/SeasonRecord";

type RecordDonutProps = {
  record: SeasonRecord;
  /** Taux de victoire entre 0 et 1. */
  winRate: number;
};

const CENTER = 64;

export function RecordDonut({ record, winRate }: RecordDonutProps) {
  const titleId = useId();
  const { win, loss } = computeDonutArcs(record);
  const circleProps = { cx: CENTER, cy: CENTER, r: DONUT_RADIUS, fill: "none", strokeWidth: 16 };

  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 128 128" width={128} height={128} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`${record.wins} victoires, ${record.losses} défaites`}</title>
        <circle {...circleProps} className="stroke-rpb-ink/8" />
        {win && (
          <circle
            {...circleProps}
            className="arc-win stroke-success"
            strokeDasharray={win.dashArray}
            strokeDashoffset={win.dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        )}
        {loss && (
          <circle
            {...circleProps}
            className="arc-loss stroke-rpb-bordeaux"
            strokeDasharray={loss.dashArray}
            strokeDashoffset={loss.dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-display text-[26px] font-black text-rpb-ink"
      >
        <CountUp value={winRate * 100} kind="percent" />
      </span>
    </div>
  );
}
