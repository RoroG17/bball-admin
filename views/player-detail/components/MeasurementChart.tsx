import { useId } from "react";
import { formatDate, formatDecimal } from "@/lib/format";
import { buildTimeSeriesPoints } from "@/models/buildTimeSeriesPoints";
import { describeMeasurementSummary } from "@/models/describeMeasurementSummary";
import type { MeasurementType } from "@/models/MeasurementType";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";
import { summarizeMeasurements } from "@/models/summarizeMeasurements";

type MeasurementChartProps = {
  type: MeasurementType;
  /** Au moins 2 mesures du type, de la plus ancienne à la plus récente. */
  measurements: PhysicalMeasurement[];
};

const WIDTH = 320;
const HEIGHT = 132;
const LEFT = 40;
const RIGHT = 14;
const TOP = 14;
const BOTTOM = 28;
const PLOT_W = WIDTH - LEFT - RIGHT;
const PLOT_H = HEIGHT - TOP - BOTTOM;
const AXIS_Y = TOP + PLOT_H;

/** Courbe de l'évolution, abscisse proportionnelle au temps (P14). Le `<title>` reprend la synthèse textuelle. */
export function MeasurementChart({ type, measurements }: MeasurementChartProps) {
  const titleId = useId();
  const values = measurements.map((measurement) => measurement.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Valeurs toutes égales : domaine de ±1 pour une ligne médiane.
  const domain = min === max ? { min: min - 1, max: max + 1 } : undefined;
  const points = buildTimeSeriesPoints(
    measurements.map((measurement) => ({ date: measurement.date, value: measurement.value })),
    { width: PLOT_W, height: PLOT_H, padding: 0 },
    domain,
  ).map((point) => ({ ...point, x: LEFT + point.x, y: TOP + point.y }));
  const topY = Math.min(...points.map((point) => point.y));
  const bottomY = Math.max(...points.map((point) => point.y));
  const summary = summarizeMeasurements(measurements, type);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={titleId} className="block h-auto w-full">
      <title id={titleId}>{summary ? describeMeasurementSummary(summary) : ""}</title>
      <line x1={LEFT} x2={LEFT + PLOT_W} y1={topY} y2={topY} className="stroke-rpb-ink/12" strokeWidth={1} />
      <text x={LEFT - 6} y={topY + 4} textAnchor="end" className="fill-rpb-ink/72 text-[12px]">
        {formatDecimal(max)}
      </text>
      <text x={LEFT - 6} y={bottomY + 4} textAnchor="end" className="fill-rpb-ink/72 text-[12px]">
        {formatDecimal(min)}
      </text>
      <g className="wipe" style={{ animationDelay: "500ms" }}>
        <path d={`${line} L${last.x} ${AXIS_Y} L${first.x} ${AXIS_Y}Z`} className="fill-rpb-gold-light" />
        <path d={line} className="fill-none stroke-rpb-bordeaux" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.slice(0, -1).map((point) => (
          <circle key={`${point.date}-${point.x}`} cx={point.x} cy={point.y} r={4} className="fill-rpb-cream stroke-rpb-bordeaux" strokeWidth={2} />
        ))}
        <circle cx={last.x} cy={last.y} r={5.5} className="fill-rpb-bordeaux stroke-rpb-ink" strokeWidth={1.5} />
      </g>
      <line x1={LEFT} x2={LEFT + PLOT_W} y1={AXIS_Y} y2={AXIS_Y} className="stroke-rpb-ink" strokeWidth={2} />
      <text x={LEFT} y={AXIS_Y + 18} className="fill-rpb-ink/72 text-[12px]">
        {formatDate(measurements[0].date, "short")}
      </text>
      <text x={LEFT + PLOT_W} y={AXIS_Y + 18} textAnchor="end" className="fill-rpb-ink/72 text-[12px]">
        {formatDate(measurements[measurements.length - 1].date, "short")}
      </text>
    </svg>
  );
}
