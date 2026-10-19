import type { AdminGameRow } from "@/models/AdminGameRow";

export type AdminGameStatsLabel = "awaiting" | "entered" | "notApplicable" | "unknown";

export const ADMIN_GAME_STATS_LABELS: Record<AdminGameStatsLabel, string> = {
  awaiting: "À saisir",
  entered: "Saisies",
  notApplicable: "—",
  unknown: "Non vérifié",
};

/** Indicateur de la colonne « Statistiques » : seuls les matchs joués ont des statistiques à saisir (D-G8). */
export function getAdminGameStatsLabel(row: AdminGameRow): AdminGameStatsLabel {
  if (row.entry.status !== "played") return "notApplicable";
  if (row.awaitingStats === null) return "unknown";
  return row.awaitingStats ? "awaiting" : "entered";
}
