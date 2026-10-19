import { useId } from "react";
import { HalfCourt } from "@/components/ui/HalfCourt";
import { ShotLegend } from "@/components/ui/ShotLegend";
import { ShotMarker } from "@/components/ui/ShotMarker";
import type { Exam } from "@/models/Exam";

type ExamShotMapProps = {
  exam: Exam;
  /** Alternative textuelle, calculée par le modèle (`describeExamShotMap`). */
  description: string;
};

export function ExamShotMap({ exam, description }: ExamShotMapProps) {
  const titleId = useId();

  return (
    <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-2.5">
      <div className="relative max-w-[560px]">
        <svg
          viewBox="0 0 750 530"
          role="img"
          aria-labelledby={titleId}
          className="block h-auto w-full rounded-md border-2 border-rpb-ink"
        >
          <title id={titleId}>{description}</title>
          <HalfCourt />
          {exam.shots.map((shot, index) => (
            <ShotMarker key={shot.id} shot={shot} index={index} />
          ))}
        </svg>
        {exam.shots.length === 0 && (
          <p className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-rpb-ink bg-rpb-cream px-3 py-2 text-sm font-semibold whitespace-nowrap">
            Aucun tir enregistré.
          </p>
        )}
      </div>
      <ShotLegend />
    </div>
  );
}
