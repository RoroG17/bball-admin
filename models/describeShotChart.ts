import { pluralize } from "@/lib/format";

/**
 * Alternative textuelle de la carte : « Tous les joueurs, tous les quart-temps : 8 tirs réussis sur 19 placés
 * sur le terrain. 19 tirs placés sur 27 tentés. » La seconde phrase n'apparaît que si la carte est incomplète.
 */
export function describeShotChart(summary: { made: number; total: number }, attempts: number, scope: string): string {
  if (summary.total === 0) return `${scope} : aucun tir placé.`;
  const placed = summary.total > 1 ? "placés" : "placé";
  const base = `${scope} : ${pluralize(summary.made, "tir réussi", "tirs réussis")} sur ${summary.total} ${placed} sur le terrain.`;
  if (attempts <= summary.total) return base;
  return `${base} ${pluralize(summary.total, "tir placé", "tirs placés")} sur ${attempts} ${attempts > 1 ? "tentés" : "tenté"}.`;
}
