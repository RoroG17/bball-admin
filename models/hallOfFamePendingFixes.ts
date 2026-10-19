import type { HallOfFameCategoryKey } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";

export type PendingBackFix = {
  id: "B1" | "B2" | "B3";
  categories: readonly HallOfFameCategoryKey[];
  modes: readonly HallOfFameMode[];
  notice: string;
};

/**
 * Corrections du back pas encore livrées : les valeurs reçues ne correspondent pas à l'intitulé de la carte.
 * Le front ne les compense pas, il le dit. Quand le back livre B1, B2 ou B3, supprimer l'entrée correspondante.
 */
export const PENDING_BACK_FIXES: readonly PendingBackFix[] = [
  {
    id: "B1",
    categories: ["fieldGoalPct"],
    modes: ["bestGame"],
    notice: "Calcul en cours de correction : ce classement ne compte pour l'instant que les tirs à 2 points.",
  },
  {
    id: "B2",
    categories: ["fieldGoalPct", "threePointPct", "freeThrowPct"],
    modes: ["averagePerGame"],
    notice: "Calcul en cours de correction : ce classement est pour l'instant identique à « Carrière ».",
  },
  {
    id: "B3",
    categories: ["fieldGoalPct", "threePointPct", "freeThrowPct"],
    modes: ["averagePerSeason"],
    notice: "Calcul en cours de correction : une saison sans tentative compte pour l'instant comme 0 %.",
  },
];
