import { formatPercent } from "@/lib/format";
import type { ExamZoneTrend } from "@/models/computeExamZoneTrend";
import { SHOT_ZONE_LABELS, type ShotZone } from "@/models/ShotZone";

const DIRECTION_TEXT: Record<ExamZoneTrend["direction"], string> = {
  up: "en progression",
  down: "en baisse",
  stable: "stable",
};

/** « 3 points : 32 % → 41 % sur les 4 derniers examens, en progression ». */
export function describeExamZoneTrend(zone: ShotZone, trend: ExamZoneTrend): string {
  return `${SHOT_ZONE_LABELS[zone]} : ${formatPercent(trend.first.ratio)} → ${formatPercent(trend.last.ratio)} sur les ${trend.examCount} derniers examens, ${DIRECTION_TEXT[trend.direction]}`;
}
