import type { Exam, ExamShot } from "@/models/Exam";
import type { ShootingTotals } from "@/models/StatTotals";
import type { ShotZone } from "@/models/ShotZone";

export type ExamSummary = {
  /** Tous les tirs, zones inconnues comprises. */
  total: ShootingTotals;
  zones: Record<ShotZone, ShootingTotals>;
  unknownZoneCount: number;
};

const count = (shots: readonly ExamShot[]): ShootingTotals => ({
  made: shots.filter((shot) => shot.made).length,
  attempted: shots.length,
});

export function summarizeExam(exam: Exam): ExamSummary {
  const inZone = (zone: ShotZone) => exam.shots.filter((shot) => shot.zone === zone);
  return {
    total: count(exam.shots),
    zones: { paint: count(inZone("paint")), midRange: count(inZone("midRange")), threePoint: count(inZone("threePoint")) },
    unknownZoneCount: exam.shots.filter((shot) => shot.zone === null).length,
  };
}
