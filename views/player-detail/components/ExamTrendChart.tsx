import { useId } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { formatDate } from "@/lib/format";
import { buildTimeSeriesPoints } from "@/models/buildTimeSeriesPoints";
import type { Exam } from "@/models/Exam";
import { SHOT_ZONE_LABELS, SHOT_ZONES, type ShotZone } from "@/models/ShotZone";

type ExamTrendChartProps = {
  /** Du plus ancien au plus récent. */
  exams: Exam[];
  /** Alternative textuelle (phrases de tendance). */
  description: string;
};

const WIDTH = 640;
const HEIGHT = 260;
const LEFT = 44;
const RIGHT = 104;
const TOP = 16;
const BOTTOM = 34;
const PLOT_W = WIDTH - LEFT - RIGHT;
const PLOT_H = HEIGHT - TOP - BOTTOM;
const AXIS_Y = TOP + PLOT_H;

const STYLES: Record<ShotZone, { line: string; dash?: string; width: number; fill: string }> = {
  paint: { line: "stroke-rpb-bordeaux", width: 2.5, fill: "fill-rpb-bordeaux" },
  midRange: { line: "stroke-rpb-ink", dash: "7 5", width: 2.5, fill: "fill-rpb-ink" },
  threePoint: { line: "stroke-rpb-red", dash: "1 6", width: 3, fill: "fill-rpb-red" },
};

type Point = { x: number; y: number };

function zonePoints(exams: Exam[], zone: ShotZone, xByDate: Map<string, number>): Point[] {
  return exams.flatMap((exam) => {
    const shots = exam.shots.filter((shot) => shot.zone === zone);
    if (shots.length === 0) return [];
    const ratio = shots.filter((shot) => shot.made).length / shots.length;
    return [{ x: LEFT + xByDate.get(exam.date)!, y: TOP + (1 - ratio) * PLOT_H }];
  });
}

function markerShape(zone: ShotZone, { x, y }: Point) {
  const cls = `${STYLES[zone].fill} stroke-rpb-cream`;
  if (zone === "paint") return <circle cx={x} cy={y} r={5.5} className={cls} strokeWidth={1.5} />;
  if (zone === "midRange") return <rect x={x - 5} y={y - 5} width={10} height={10} className={cls} strokeWidth={1.5} />;
  return <path d={`M${x} ${y - 7}L${x + 7} ${y + 6}H${x - 7}Z`} className={cls} strokeWidth={1.5} strokeLinejoin="round" />;
}

/** Réussite par zone sur l'échelle du TEMPS (P14). Défile horizontalement sous 560 px (DS54). */
export function ExamTrendChart({ exams, description }: ExamTrendChartProps) {
  const titleId = useId();
  const xByDate = new Map(
    buildTimeSeriesPoints(
      exams.map((exam) => ({ date: exam.date, value: 0 })),
      { width: PLOT_W, height: PLOT_H, padding: 0 },
    ).map((point) => [point.date, point.x]),
  );
  const series = SHOT_ZONES.map((zone) => ({ zone, points: zonePoints(exams, zone, xByDate) })).filter(
    (entry) => entry.points.length > 0,
  );

  // Étiquettes directes : décalées de 14 px si deux extrémités se touchent.
  const labels = series
    .map(({ zone, points }) => ({ zone, x: points[points.length - 1].x + 12, y: points[points.length - 1].y }))
    .sort((a, b) => a.y - b.y);
  labels.forEach((label, index) => {
    if (index > 0 && label.y - labels[index - 1].y < 14) label.y = labels[index - 1].y + 14;
  });
  const first = exams[0];
  const last = exams[exams.length - 1];

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2.5">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={titleId} className="block h-auto w-full max-w-[760px] min-w-[560px]">
          <title id={titleId}>{description}</title>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = TOP + (1 - ratio) * PLOT_H;
            return (
              <g key={ratio}>
                <line x1={LEFT} x2={LEFT + PLOT_W} y1={y} y2={y} className="stroke-rpb-ink/12" strokeWidth={1} />
                <text x={36} y={y + 4} textAnchor="end" className="fill-rpb-ink/72 text-[12px]">
                  {ratio * 100} %
                </text>
              </g>
            );
          })}
          <line x1={LEFT} x2={LEFT + PLOT_W} y1={AXIS_Y} y2={AXIS_Y} className="stroke-rpb-ink" strokeWidth={2} />
          {exams.map((exam) => {
            const x = LEFT + xByDate.get(exam.date)!;
            return <line key={exam.id} x1={x} x2={x} y1={AXIS_Y} y2={AXIS_Y + 6} className="stroke-rpb-ink" strokeWidth={2} />;
          })}
          <text x={LEFT} y={AXIS_Y + 24} className="fill-rpb-ink/72 text-[12px]">
            {formatDate(first.date, "short")}
          </text>
          {last !== first && (
            <text x={LEFT + PLOT_W} y={AXIS_Y + 24} textAnchor="end" className="fill-rpb-ink/72 text-[12px]">
              {formatDate(last.date, "short")}
            </text>
          )}
          {series.map(({ zone, points }, index) => (
            <g key={zone} className="wipe" style={animationDelay(300 + index * 200)}>
              <path
                d={points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")}
                className={`fill-none ${STYLES[zone].line}`}
                strokeWidth={STYLES[zone].width}
                strokeDasharray={STYLES[zone].dash}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point) => (
                <g key={point.x}>{markerShape(zone, point)}</g>
              ))}
            </g>
          ))}
          {labels.map((label) => (
            <text key={label.zone} x={label.x} y={label.y + 4} className={`${STYLES[label.zone].fill} text-[12px] font-semibold`}>
              {SHOT_ZONE_LABELS[label.zone]}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}
