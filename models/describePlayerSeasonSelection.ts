import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import type { PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";

/** Libellé complet de la sélection, jamais l'identifiant (P9). */
export function describePlayerSeasonSelection(selection: PlayerSeasonSelection): string {
  return selection.kind === "career" ? "Carrière (toutes les saisons)" : formatSeasonLabel(selection.season);
}
