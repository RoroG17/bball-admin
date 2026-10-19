import { ArrowDownIcon } from "@/components/ui/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/ui/icons/ArrowUpIcon";
import { EqualIcon } from "@/components/ui/icons/EqualIcon";
import { formatDate, formatSignedDecimal } from "@/lib/format";
import { MEASUREMENT_UNITS } from "@/models/MeasurementType";
import type { MeasurementSummary } from "@/models/summarizeMeasurements";

type MeasurementDeltaProps = { summary: MeasurementSummary };

const NBSP = " ";

/** Écart avec la mesure précédente. Aucune couleur de valeur : une hausse n'est ni bonne ni mauvaise en soi (DS48). */
export function MeasurementDelta({ summary }: MeasurementDeltaProps) {
  const { delta, previous, type } = summary;

  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]/[18px] text-rpb-ink/72">
      {previous === null || delta === null ? (
        "Première mesure"
      ) : (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-rpb-gold-light px-2 py-0.5 font-semibold whitespace-nowrap text-rpb-ink tabular-nums">
            {delta > 0 && <ArrowUpIcon size={12} strokeWidth={3} />}
            {delta < 0 && <ArrowDownIcon size={12} strokeWidth={3} />}
            {delta === 0 && <EqualIcon size={12} strokeWidth={3} />}
            {delta === 0 ? "stable" : `${formatSignedDecimal(delta)}${NBSP}${MEASUREMENT_UNITS[type]}`}
          </span>
          <span>depuis le {formatDate(previous.date)}</span>
        </>
      )}
    </span>
  );
}
