import { formatDate, formatMeasurementValue } from "@/lib/format";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS, type MeasurementType } from "@/models/MeasurementType";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";

type MeasurementHistoryTableProps = {
  type: MeasurementType;
  /** Du plus récent au plus ancien. */
  measurements: PhysicalMeasurement[];
};

const HEAD = "border-b-2 border-rpb-ink px-2 py-1.5 text-xs font-semibold tracking-[.06em] text-rpb-ink/72 uppercase";
const CELL = "border-b border-rpb-ink/12 px-2 py-1.5";

export function MeasurementHistoryTable({ type, measurements }: MeasurementHistoryTableProps) {
  return (
    <table className="w-full border-collapse text-sm tabular-nums">
      <caption className="sr-only">Historique des mesures : {MEASUREMENT_LABELS[type].toLowerCase()}</caption>
      <thead>
        <tr>
          <th scope="col" className={`${HEAD} text-left`}>
            Date
          </th>
          <th scope="col" className={`${HEAD} text-right`}>
            Valeur
          </th>
        </tr>
      </thead>
      <tbody>
        {measurements.map((measurement) => (
          <tr key={measurement.id}>
            <th scope="row" className={`${CELL} text-left font-normal`}>
              {formatDate(measurement.date)}
            </th>
            <td className={`${CELL} text-right font-semibold`}>
              {formatMeasurementValue(measurement.value, MEASUREMENT_UNITS[type])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
