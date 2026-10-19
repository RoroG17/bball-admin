import "server-only";
import { cache } from "react";
import { assignHallOfFameRanks } from "@/models/assignHallOfFameRanks";
import { getHallOfFameDigits } from "@/models/getHallOfFameDigits";
import { HALL_OF_FAME_CATEGORIES, type HallOfFameCategoryKey } from "@/models/HallOfFameCategory";
import { HALL_OF_FAME_MODES, type HallOfFameMode } from "@/models/HallOfFameMode";
import { isOpponentPlaceholder } from "@/models/isOpponentPlaceholder";
import type { HallOfFameStat } from "@/models/HallOfFameStat";
import {
  HALL_OF_FAME_BACK_KEYS,
  HALL_OF_FAME_BACK_MODES,
  HallOfFameEmptinessDto,
  HallOfFameEnvelopeDto,
  HallOfFameStatDto,
} from "@/repositories/dto/HallOfFameDto";
import { fetchHallOfFamePayload } from "@/repositories/sources/hallOfFameSource";

/**
 * Vrai si au moins une liste du palmarès contient un joueur. Lève si l'appel échoue ou si la forme générale de la
 * réponse est invalide : c'est une panne globale (`error.tsx`), pas une base vide.
 */
export async function hasHallOfFameRecords(): Promise<boolean> {
  const { rankings } = HallOfFameEmptinessDto.parse(await fetchHallOfFamePayload());
  return Object.values(rankings).some((category) => Object.values(category).some((list) => list.length > 0));
}

/**
 * Les 5 classements d'une catégorie, rangs ex æquo compris. Lève si la tranche de cette catégorie est invalide :
 * seule sa carte est en erreur, les autres catégories ne sont pas touchées.
 */
export const getHallOfFameStat = cache(async (key: HallOfFameCategoryKey): Promise<HallOfFameStat> => {
  const category = HALL_OF_FAME_CATEGORIES.find((candidate) => candidate.key === key)!;
  const { rankings } = HallOfFameEnvelopeDto.parse(await fetchHallOfFamePayload());
  const slice = HallOfFameStatDto(category.kind).parse(rankings[HALL_OF_FAME_BACK_KEYS[key]]);

  const entries = Object.fromEntries(
    HALL_OF_FAME_MODES.map((mode) => [
      mode,
      // Le faux joueur « adversaire » est retiré AVANT le calcul des rangs.
      assignHallOfFameRanks(
        slice[HALL_OF_FAME_BACK_MODES[mode] as keyof typeof slice].filter((entry) => !isOpponentPlaceholder(entry.player)),
        getHallOfFameDigits(category, mode),
      ),
    ]),
  ) as Record<HallOfFameMode, HallOfFameStat["rankings"][HallOfFameMode]>;

  return { category, rankings: entries };
});
