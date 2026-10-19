import type { AdminGameRow } from "@/models/AdminGameRow";

export type AdminGameRowAction = "view" | "edit" | "enterStats" | "delete";

/**
 * Actions d'une ligne. « Saisir les stats » seulement si le match est à saisir ET si la saisie live a une route V2
 * (`enterStatsAvailable`, faux en V2.0, D-G8).
 */
export function getAdminGameRowActions(
  row: AdminGameRow,
  options: { enterStatsAvailable: boolean },
): AdminGameRowAction[] {
  const actions: AdminGameRowAction[] = ["view", "edit"];
  if (row.awaitingStats === true && options.enterStatsAvailable) actions.push("enterStats");
  actions.push("delete");
  return actions;
}
