import type { HallOfFameMode } from "@/models/HallOfFameMode";

const DESCRIPTIONS: Record<HallOfFameMode, Record<"volume" | "percent", string>> = {
  bestGame: {
    volume: "Record sur un seul match",
    percent: "Meilleur pourcentage sur un seul match",
  },
  averagePerGame: {
    volume: "Moyenne par match joué",
    percent: "Moyenne des pourcentages de chaque match (matchs sans tentative exclus)",
  },
  bestSeason: {
    volume: "Meilleur total sur une saison",
    percent: "Meilleur pourcentage sur une saison",
  },
  averagePerSeason: {
    volume: "Moyenne des totaux de chaque saison (et non par match)",
    percent: "Moyenne des pourcentages de chaque saison (saisons sans tentative exclues)",
  },
  career: {
    volume: "Total sur toute la carrière",
    percent: "Pourcentage global sur toute la carrière",
  },
};

/** Sous-titre de carte : dit ce que mesure le mode. */
export function describeHallOfFameMode(mode: HallOfFameMode, kind: "volume" | "percent"): string {
  return DESCRIPTIONS[mode][kind];
}
