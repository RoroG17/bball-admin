import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { computeExamZoneTrend } from "@/models/computeExamZoneTrend";
import { describeExamZoneTrend } from "@/models/describeExamZoneTrend";
import type { Exam } from "@/models/Exam";
import { SHOT_ZONES } from "@/models/ShotZone";
import { sortExamsByDate } from "@/models/sortExamsByDate";
import { ExamTrendChart } from "@/views/player-detail/components/ExamTrendChart";
import { ExamTrendTable } from "@/views/player-detail/components/ExamTrendTable";
import { ExamZoneMarker } from "@/views/player-detail/components/ExamZoneMarker";

type ExamTrendSectionProps = { exams: Exam[] };

const NO_TREND = "La tendance s'affiche à partir de 3 examens.";

export function ExamTrendSection({ exams }: ExamTrendSectionProps) {
  const sentences = SHOT_ZONES.flatMap((zone) => {
    const trend = computeExamZoneTrend(exams, zone);
    return trend ? [{ zone, text: describeExamZoneTrend(zone, trend) }] : [];
  });
  const description =
    sentences.length > 0
      ? sentences.map((sentence) => sentence.text).join(". ")
      : `Réussite par zone et par examen. ${NO_TREND}`;

  return (
    <Card
      title="Progression par zone"
      subtitle={<p className="text-[13px] text-rpb-ink/72">Réussite à chaque examen, placée sur l&apos;échelle du temps</p>}
      animation="reveal"
      delayMs={420}
    >
      {sentences.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {sentences.map(({ zone, text }) => (
            <li key={zone} className="flex items-start gap-2.5 text-[15px]/[22px]">
              <ExamZoneMarker zone={zone} size={14} className="mt-1 shrink-0" />
              {text}
            </li>
          ))}
        </ul>
      ) : (
        <SummaryNotice tone="light" message={NO_TREND} />
      )}
      <ExamTrendChart exams={sortExamsByDate(exams, "asc")} description={description} />
      <Disclosure summary="Voir le détail par examen" size="sm">
        <ExamTrendTable exams={sortExamsByDate(exams, "desc")} />
      </Disclosure>
    </Card>
  );
}
