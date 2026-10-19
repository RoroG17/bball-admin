import type { DeletionImpact } from "@/models/DeletionImpact";

/** Un match n'a pas d'autre dépendance que ses lignes de statistiques (`jouer`, tirs via `jouer`). `null` : indéterminé. */
export function computeGameDeletionImpact(statLineCount: number | null): DeletionImpact {
  return { lines: [{ kind: "statLine", count: statLineCount }], complete: statLineCount !== null };
}
