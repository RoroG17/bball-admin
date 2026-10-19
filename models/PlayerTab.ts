export const PLAYER_TABS = ["statistics", "exams", "physical"] as const;

export type PlayerTab = (typeof PLAYER_TABS)[number];

export const PLAYER_TAB_LABELS: Record<PlayerTab, string> = {
  statistics: "Statistiques",
  exams: "Examens",
  physical: "Physique",
};

/** Valeurs de `?onglet=`. */
export const PLAYER_TAB_PARAMS: Record<PlayerTab, string> = {
  statistics: "statistiques",
  exams: "examens",
  physical: "physique",
};
