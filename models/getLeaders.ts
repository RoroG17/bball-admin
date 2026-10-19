import type { Ranking } from "@/models/Ranking";
import type { RankingEntry } from "@/models/RankingEntry";

export type Leader = { ranking: Ranking; entry: RankingEntry };

/** Une tuile par joueur classé 1er (ex æquo compris), pour chaque catégorie mise en avant. */
export function getLeaders(rankings: readonly Ranking[]): Leader[] {
  return rankings
    .filter((ranking) => ranking.category.showInLeaders)
    .flatMap((ranking) => ranking.entries.filter((entry) => entry.rank === 1).map((entry) => ({ ranking, entry })));
}
