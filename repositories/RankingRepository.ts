import "server-only";
import { z } from "zod";
import { assignRanks } from "@/models/assignRanks";
import { isOpponentPlaceholder } from "@/models/isOpponentPlaceholder";
import type { Ranking } from "@/models/Ranking";
import { RANKING_CATEGORIES, type RankingCategoryKey } from "@/models/RankingCategory";
import { RankingsSliceDto } from "@/repositories/dto/HomeSlicesDto";
import { fetchHomePayload } from "@/repositories/sources/homeSource";

type RankingsSlice = z.infer<typeof RankingsSliceDto>;

const SOURCE_KEYS: Record<RankingCategoryKey, keyof RankingsSlice> = {
  points: "classPTSActuelle",
  assists: "classPDActuelle",
  rebounds: "classRebActuelle",
  steals: "classIntActuelle",
  blocks: "classContreActuelle",
  turnovers: "classBPActuelle",
  twoPointPct: "classShootActuelle",
  threePointPct: "class3PtsActuelle",
  freeThrowPct: "classLFActuelle",
};

/**
 * Les 9 classements de la saison, dans l'ordre d'affichage.
 * Tri par valeur décroissante (ballons perdus compris : le 1er est celui qui en perd le plus), puis rangs ex æquo.
 */
export async function listSeasonRankings(seasonId: number): Promise<Ranking[]> {
  const slice = RankingsSliceDto.parse(await fetchHomePayload(seasonId));
  return RANKING_CATEGORIES.map((category) => {
    // Le faux joueur « adversaire » est retiré AVANT le tri et le calcul des rangs (classements et leaders).
    const sorted = slice[SOURCE_KEYS[category.key]]
      .filter((entry) => !isOpponentPlaceholder(entry.player))
      .sort((a, b) => b.value - a.value);
    return { category, entries: assignRanks(sorted) };
  });
}
