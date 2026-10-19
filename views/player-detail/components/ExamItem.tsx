import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { formatDate, formatPercentDecimal, formatShootingRatio } from "@/lib/format";
import { computeShootingPercentage } from "@/models/computeShootingPercentage";
import { describeExamShotMap } from "@/models/describeExamShotMap";
import type { Exam } from "@/models/Exam";
import { summarizeExam } from "@/models/summarizeExam";
import { ExamShotMap } from "@/views/player-detail/components/ExamShotMap";
import { ExamZoneSummary } from "@/views/player-detail/components/ExamZoneSummary";

type ExamItemProps = {
  exam: Exam;
  /** Le plus récent est ouvert par défaut (DS54). */
  defaultOpen: boolean;
};

/** `<details>` natif : aucun JavaScript. */
export function ExamItem({ exam, defaultOpen }: ExamItemProps) {
  const summary = summarizeExam(exam);
  const { made, attempted } = summary.total;

  return (
    <details className="group rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream open:border-rpb-ink" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-md px-4 py-3 transition-colors focus-ring hover:bg-rpb-gold-light [&::-webkit-details-marker]:hidden">
        <CalendarIcon size={18} className="shrink-0 text-rpb-bordeaux" />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-base/[22px] font-bold">Examen du {formatDate(exam.date)}</span>
          <span className="text-sm text-rpb-ink/72 tabular-nums">
            {attempted === 0
              ? "Aucun tir"
              : `${formatShootingRatio(made, attempted)} réussis · ${formatPercentDecimal(computeShootingPercentage(made, attempted), 0)}`}
          </span>
        </span>
        <ChevronDownIcon size={18} className="shrink-0 text-rpb-bordeaux transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-wrap items-start gap-5 border-t border-rpb-ink/12 p-4">
        <ExamZoneSummary summary={summary} />
        <ExamShotMap exam={exam} description={describeExamShotMap(exam, summary)} />
      </div>
    </details>
  );
}
