import { formatDate, formatPercentDecimal, formatShootingRatio } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import type { Exam } from "@/models/Exam";
import { SHOT_ZONE_LABELS, SHOT_ZONES } from "@/models/ShotZone";
import { summarizeExam } from "@/models/summarizeExam";

type ExamTrendTableProps = {
  /** Du plus récent au plus ancien. */
  exams: Exam[];
};

const HEAD_CELL =
  "border-b-2 border-rpb-ink px-2.5 py-2 text-xs font-semibold tracking-[.06em] whitespace-nowrap text-rpb-ink/72 uppercase";
const BODY_CELL = "border-b border-rpb-ink/12 px-2.5 py-2 text-sm";

/** Alternative textuelle de la courbe : « 8/10 · 80 % », « — » sans tir. */
export function ExamTrendTable({ exams }: ExamTrendTableProps) {
  return (
    <div className="relative min-w-0 overflow-x-auto">
      <table className="w-full border-collapse tabular-nums">
        <caption className="sr-only">Réussite par examen et par zone</caption>
        <thead>
          <tr>
            <th scope="col" className={`${HEAD_CELL} text-left`}>
              Date
            </th>
            {SHOT_ZONES.map((zone) => (
              <th key={zone} scope="col" className={`${HEAD_CELL} text-right`}>
                {SHOT_ZONE_LABELS[zone]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const summary = summarizeExam(exam);
            return (
              <tr key={exam.id}>
                <th scope="row" className={`${BODY_CELL} text-left font-medium whitespace-nowrap`}>
                  {formatDate(exam.date)}
                </th>
                {SHOT_ZONES.map((zone) => {
                  const { made, attempted } = summary.zones[zone];
                  return (
                    <td key={zone} className={`${BODY_CELL} text-right whitespace-nowrap`}>
                      {attempted === 0
                        ? "—"
                        : `${formatShootingRatio(made, attempted)} · ${formatPercentDecimal(computeShootingPercentage(made, attempted), 0)}`}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
