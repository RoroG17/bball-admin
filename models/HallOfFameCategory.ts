export const HALL_OF_FAME_CATEGORY_KEYS = [
  "points",
  "assists",
  "rebounds",
  "steals",
  "blocks",
  "turnovers",
  "fieldGoalPct",
  "threePointPct",
  "freeThrowPct",
] as const;

export type HallOfFameCategoryKey = (typeof HALL_OF_FAME_CATEGORY_KEYS)[number];

export type HallOfFameCategory = {
  key: HallOfFameCategoryKey;
  kind: "volume" | "percent";
  /** Libellé court : « Points », « % Tirs »… */
  label: string;
  /** Titre de la carte. Ballons perdus : « Le plus de ballons perdus » (le tri reste décroissant). */
  title: string;
  /** Précision sous le sous-titre de mode (ex. « Tirs à 2 et 3 points »), sinon `null`. */
  scopeNote: string | null;
  /** Ballons perdus : le 1er est celui qui en perd le plus, donc ni pastille or ni mise en avant. */
  lowerIsBetter: boolean;
};

/** Les 9 catégories, dans l'ordre d'affichage. « % Tirs » compte les tirs à 2 et 3 points. */
export const HALL_OF_FAME_CATEGORIES: readonly HallOfFameCategory[] = [
  { key: "points", kind: "volume", label: "Points", title: "Points", scopeNote: null, lowerIsBetter: false },
  {
    key: "assists",
    kind: "volume",
    label: "Passes décisives",
    title: "Passes décisives",
    scopeNote: null,
    lowerIsBetter: false,
  },
  {
    key: "rebounds",
    kind: "volume",
    label: "Rebonds",
    title: "Rebonds",
    scopeNote: "Offensifs et défensifs",
    lowerIsBetter: false,
  },
  { key: "steals", kind: "volume", label: "Interceptions", title: "Interceptions", scopeNote: null, lowerIsBetter: false },
  { key: "blocks", kind: "volume", label: "Contres", title: "Contres", scopeNote: null, lowerIsBetter: false },
  {
    key: "turnovers",
    kind: "volume",
    label: "Ballons perdus",
    title: "Le plus de ballons perdus",
    scopeNote: "Moins de ballons perdus = mieux",
    lowerIsBetter: true,
  },
  {
    key: "fieldGoalPct",
    kind: "percent",
    label: "% Tirs",
    title: "% Tirs",
    scopeNote: "Tirs à 2 et 3 points",
    lowerIsBetter: false,
  },
  { key: "threePointPct", kind: "percent", label: "% 3 pts", title: "% 3 pts", scopeNote: null, lowerIsBetter: false },
  {
    key: "freeThrowPct",
    kind: "percent",
    label: "% LF",
    title: "% lancers francs",
    scopeNote: null,
    lowerIsBetter: false,
  },
];
