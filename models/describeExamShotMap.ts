import { formatDate, formatShootingRatio, pluralize } from "@/lib/format";
import type { Exam } from "@/models/Exam";
import type { ExamSummary } from "@/models/summarizeExam";
import { SHOT_ZONE_LABELS, SHOT_ZONES } from "@/models/ShotZone";

/**
 * Alternative textuelle de la carte des tirs : « Examen du 12 mars 2026 : 14 tirs réussis sur 30. Raquette 8/10,
 * mi-distance 4/12, 3 points : aucun tir. + 2 tirs sans zone. »
 */
export function describeExamShotMap(exam: Exam, summary: ExamSummary): string {
  const heading = `Examen du ${formatDate(exam.date)}`;
  if (summary.total.attempted === 0) return `${heading} : aucun tir.`;
  const zones = SHOT_ZONES.map((zone, index) => {
    const label = index === 0 ? SHOT_ZONE_LABELS[zone] : SHOT_ZONE_LABELS[zone].toLocaleLowerCase("fr-FR");
    const totals = summary.zones[zone];
    return totals.attempted === 0 ? `${label} : aucun tir` : `${label} ${formatShootingRatio(totals.made, totals.attempted)}`;
  }).join(", ");
  const unknown = summary.unknownZoneCount > 0 ? ` + ${pluralize(summary.unknownZoneCount, "tir", "tirs")} sans zone.` : "";
  return `${heading} : ${pluralize(summary.total.made, "tir réussi", "tirs réussis")} sur ${summary.total.attempted}. ${zones}.${unknown}`;
}
