import type { PlayerTab } from "@/models/PlayerTab";
import type { PlayerVisibility } from "@/models/PlayerVisibility";

/** Onglets autorisés, dans l'ordre Statistiques, Examens, Physique. */
export function listVisiblePlayerTabs(visibility: PlayerVisibility): PlayerTab[] {
  const tabs: PlayerTab[] = [];
  if (visibility.matchStats) tabs.push("statistics");
  if (visibility.exams) tabs.push("exams");
  if (visibility.physical) tabs.push("physical");
  return tabs;
}
