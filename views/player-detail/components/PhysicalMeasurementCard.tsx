import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { formatDate, formatDecimal } from "@/lib/format";
import { formatMeasurementLabelInline } from "@/models/formatMeasurementLabelInline";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS, type MeasurementType } from "@/models/MeasurementType";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";
import { sortMeasurementsByDate } from "@/models/sortMeasurementsByDate";
import { summarizeMeasurements } from "@/models/summarizeMeasurements";
import { MeasurementChart } from "@/views/player-detail/components/MeasurementChart";
import { MeasurementDelta } from "@/views/player-detail/components/MeasurementDelta";
import { MeasurementHistoryTable } from "@/views/player-detail/components/MeasurementHistoryTable";

type PhysicalMeasurementCardProps = {
  type: MeasurementType;
  /** Mesures de CE type seulement. */
  measurements: PhysicalMeasurement[];
  index: number;
};

export function PhysicalMeasurementCard({ type, measurements, index }: PhysicalMeasurementCardProps) {
  const sorted = sortMeasurementsByDate(measurements);
  const summary = summarizeMeasurements(sorted, type);

  return (
    <Card
      title={MEASUREMENT_LABELS[type]}
      aside={<span className="text-[13px] text-rpb-ink/72">{MEASUREMENT_UNITS[type]}</span>}
      animation="reveal"
      delayMs={460 + index * 80}
    >
      {summary === null ? (
        <p className="text-sm text-rpb-ink/72">Aucune mesure de {formatMeasurementLabelInline(type)}.</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-display text-[40px] leading-none font-black tabular-nums">
                {formatDecimal(summary.latest.value)}
              </span>
              <span className="text-lg font-bold">{MEASUREMENT_UNITS[type]}</span>
            </p>
            <p className="text-[13px]/[18px] text-rpb-ink/72">Mesuré le {formatDate(summary.latest.date)}</p>
            <MeasurementDelta summary={summary} />
            {sorted.length === 1 && (
              <p className="text-[13px]/[18px] text-rpb-ink/72">La courbe s&apos;affiche à partir de 2 mesures.</p>
            )}
          </div>
          {sorted.length >= 2 && <MeasurementChart type={type} measurements={sorted} />}
          <Disclosure summary={`Historique (${sorted.length} ${sorted.length > 1 ? "mesures" : "mesure"})`} size="sm">
            <MeasurementHistoryTable type={type} measurements={[...sorted].reverse()} />
          </Disclosure>
        </>
      )}
    </Card>
  );
}
