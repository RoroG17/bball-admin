import { formatDate, formatDecimal } from "@/lib/format";
import { describeMeasurementSummary } from "@/models/describeMeasurementSummary";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS, type MeasurementType } from "@/models/MeasurementType";
import type { MeasurementSummary } from "@/models/summarizeMeasurements";
import { MeasurementDelta } from "@/views/player-detail/components/MeasurementDelta";

type MeasurementSummaryTileProps = {
  type: MeasurementType;
  summary: MeasurementSummary | null;
};

export function MeasurementSummaryTile({ type, summary }: MeasurementSummaryTileProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border-2 border-rpb-ink/14 px-3.5 py-3">
      <dt className="text-[11px]/4 font-semibold tracking-[.08em] text-rpb-ink/72 uppercase">{MEASUREMENT_LABELS[type]}</dt>
      {summary === null ? (
        <dd className="text-sm text-rpb-ink/72">Aucune mesure</dd>
      ) : (
        <dd className="flex flex-col gap-1.5">
          <span className="sr-only">{describeMeasurementSummary(summary)}</span>
          <span aria-hidden="true" className="flex flex-col gap-1.5">
            <span className="flex items-baseline gap-1">
              <span className="font-display text-[28px] leading-none font-black tabular-nums">
                {formatDecimal(summary.latest.value)}
              </span>
              <span className="text-[15px] font-semibold">{MEASUREMENT_UNITS[type]}</span>
            </span>
            <span className="text-[13px]/[18px] text-rpb-ink/72">le {formatDate(summary.latest.date)}</span>
            <MeasurementDelta summary={summary} />
          </span>
        </dd>
      )}
    </div>
  );
}
