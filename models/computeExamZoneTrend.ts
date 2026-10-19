import { daysBetween } from "@/models/daysBetween";
import type { Exam } from "@/models/Exam";
import type { ShotZone } from "@/models/ShotZone";
import { sortExamsByDate } from "@/models/sortExamsByDate";

export type ExamZoneTrend = {
  examCount: number;
  first: { date: string; ratio: number };
  last: { date: string; ratio: number };
  direction: "up" | "down" | "stable";
};

/** Nombre minimal d'examens (avec au moins un tir dans la zone) pour parler de tendance (D11). */
export const MIN_TREND_EXAMS = 3;
/** Variation projetée sous laquelle la tendance est « stable » : 2 points de pourcentage (D11). */
const STABLE_THRESHOLD = 0.02;

/**
 * Tendance de réussite d'une zone, sur l'échelle du TEMPS et non de l'index (P14) : pente des moindres carrés du
 * ratio en fonction du nombre de jours, projetée sur la période. `null` sous 3 examens.
 */
export function computeExamZoneTrend(exams: readonly Exam[], zone: ShotZone): ExamZoneTrend | null {
  const points = sortExamsByDate(exams, "asc")
    .map((exam) => {
      const shots = exam.shots.filter((shot) => shot.zone === zone);
      return { date: exam.date, attempted: shots.length, ratio: shots.filter((shot) => shot.made).length / shots.length };
    })
    .filter((point) => point.attempted > 0);
  if (points.length < MIN_TREND_EXAMS) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const xs = points.map((point) => daysBetween(first.date, point.date));
  const span = xs[xs.length - 1];
  let direction: ExamZoneTrend["direction"] = "stable";
  if (span > 0) {
    const meanX = xs.reduce((total, x) => total + x, 0) / xs.length;
    const meanY = points.reduce((total, point) => total + point.ratio, 0) / points.length;
    const covariance = points.reduce((total, point, index) => total + (xs[index] - meanX) * (point.ratio - meanY), 0);
    const variance = xs.reduce((total, x) => total + (x - meanX) ** 2, 0);
    const projected = (covariance / variance) * span;
    if (projected > STABLE_THRESHOLD) direction = "up";
    else if (projected < -STABLE_THRESHOLD) direction = "down";
  }

  return {
    examCount: points.length,
    first: { date: first.date, ratio: first.ratio },
    last: { date: last.date, ratio: last.ratio },
    direction,
  };
}
