import { Card } from "@/components/ui/Card";
import type { Exam } from "@/models/Exam";
import { ExamItem } from "@/views/player-detail/components/ExamItem";

type ExamListProps = {
  /** Du plus récent au plus ancien. */
  exams: Exam[];
};

export function ExamList({ exams }: ExamListProps) {
  return (
    <Card
      title="Historique des examens"
      animation="on-scroll"
      aside={<span className="text-[13px] text-rpb-ink/72">Du plus récent au plus ancien</span>}
    >
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {exams.map((exam, index) => (
          <li key={exam.id}>
            <ExamItem exam={exam} defaultOpen={index === 0} />
          </li>
        ))}
      </ol>
    </Card>
  );
}
