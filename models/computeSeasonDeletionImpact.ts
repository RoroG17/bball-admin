import type { DeletionImpact } from "@/models/DeletionImpact";
import type { SeasonDeletionFacts } from "@/models/SeasonDeletionFacts";

/** Ce que la suppression emporte (D-ADM-1) : matchs, inscriptions, lignes de statistiques. `null` est conservé tel quel. */
export function computeSeasonDeletionImpact(facts: SeasonDeletionFacts): DeletionImpact {
  return {
    lines: [
      { kind: "game", count: facts.gameCount },
      { kind: "participation", count: facts.participantCount },
      { kind: "statLine", count: facts.statLineCount },
    ],
    complete: facts.statLineCount !== null,
  };
}
