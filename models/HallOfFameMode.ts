/** Les 5 modes de classement, dans l'ordre des onglets. */
export const HALL_OF_FAME_MODES = ["bestGame", "averagePerGame", "bestSeason", "averagePerSeason", "career"] as const;

export type HallOfFameMode = (typeof HALL_OF_FAME_MODES)[number];

export const DEFAULT_HALL_OF_FAME_MODE: HallOfFameMode = "bestGame";

export const HALL_OF_FAME_MODE_LABELS: Record<HallOfFameMode, { tab: string; long: string }> = {
  bestGame: { tab: "Match", long: "Meilleur match" },
  averagePerGame: { tab: "Moyenne par match", long: "Moyenne par match" },
  bestSeason: { tab: "Saison", long: "Meilleure saison" },
  averagePerSeason: { tab: "Moyenne par saison", long: "Moyenne par saison" },
  career: { tab: "Carrière", long: "Carrière" },
};

/** Valeur du paramètre d'URL `?mode=` (en français, comme `?saison=`, `?onglet=` et `?periode=`). */
export const HALL_OF_FAME_MODE_PARAMS: Record<HallOfFameMode, string> = {
  bestGame: "match",
  averagePerGame: "moyenne-match",
  bestSeason: "saison",
  averagePerSeason: "moyenne-saison",
  career: "carriere",
};
