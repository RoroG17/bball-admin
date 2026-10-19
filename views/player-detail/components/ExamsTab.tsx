import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BallIcon } from "@/components/ui/icons/BallIcon";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { animationDelay } from "@/lib/animationDelay";
import { pluralize } from "@/lib/format";
import { listPlayerExams } from "@/repositories/ExamRepository";
import { ExamList } from "@/views/player-detail/components/ExamList";
import { ExamTrendSection } from "@/views/player-detail/components/ExamTrendSection";

type ExamsTabProps = { licence: string; isAdmin: boolean };

export async function ExamsTab({ licence, isAdmin }: ExamsTabProps) {
  const exams = await listPlayerExams(licence);

  return (
    <section aria-labelledby="player-tab-exams" className="flex flex-col gap-5">
      <h2 id="player-tab-exams" className="sr-only">
        Examens
      </h2>
      <div className="reveal flex flex-wrap items-center justify-between gap-4" style={animationDelay(380)}>
        <p className="text-[15px]/[22px] font-semibold tabular-nums">{pluralize(exams.length, "examen de tir", "examens de tir")}</p>
        {isAdmin && (
          <PrimaryButton href={`/player/${encodeURIComponent(licence)}/examens/nouveau`}>
            <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Créer un examen
          </PrimaryButton>
        )}
      </div>
      {exams.length === 0 ? (
        <Card title="Examens" animation="reveal" delayMs={420}>
          <EmptyState icon={<BallIcon size={40} strokeWidth={1.6} />} title="Aucun examen enregistré pour ce joueur." />
        </Card>
      ) : (
        <>
          <ExamTrendSection exams={exams} />
          <ExamList exams={exams} />
        </>
      )}
    </section>
  );
}
