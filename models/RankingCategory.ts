export const RANKING_CATEGORY_KEYS = [
  "points",
  "assists",
  "rebounds",
  "steals",
  "blocks",
  "turnovers",
  "twoPointPct",
  "threePointPct",
  "freeThrowPct",
] as const;

export type RankingCategoryKey = (typeof RANKING_CATEGORY_KEYS)[number];

export type RankingCategory = {
  key: RankingCategoryKey;
  /** Titre de la carte : « Points », « % tirs à 2 pts »… */
  label: string;
  /** Sous-titre de la carte de classement. */
  subtitle: string;
  valueUnit: "perGame" | "percent";
  /** Libellé court du cumul de saison : « pts », « tirs réussis »… */
  totalLabel: string;
  /** Unité affichée sous la valeur d'un leader. */
  leaderUnit: string;
  /** Vrai pour les ballons perdus : le 1er du classement est celui qui en perd le plus. */
  lowerIsBetter: boolean;
  /** Faux pour les ballons perdus : on ne met pas en avant le plus gros perdeur de balles. */
  showInLeaders: boolean;
};

const PERCENT_SUBTITLE = "Réussite moyenne par match";

/** Les 9 classements, dans l'ordre d'affichage. */
export const RANKING_CATEGORIES: readonly RankingCategory[] = [
  {
    key: "points",
    label: "Points",
    subtitle: "Points par match",
    valueUnit: "perGame",
    totalLabel: "pts",
    leaderUnit: "pts / match",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "assists",
    label: "Passes décisives",
    subtitle: "Passes décisives par match",
    valueUnit: "perGame",
    totalLabel: "passes",
    leaderUnit: "passes / match",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "rebounds",
    label: "Rebonds",
    subtitle: "Rebonds par match",
    valueUnit: "perGame",
    totalLabel: "rebonds",
    leaderUnit: "reb. / match",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "steals",
    label: "Interceptions",
    subtitle: "Interceptions par match",
    valueUnit: "perGame",
    totalLabel: "int.",
    leaderUnit: "int. / match",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "blocks",
    label: "Contres",
    subtitle: "Contres par match",
    valueUnit: "perGame",
    totalLabel: "contres",
    leaderUnit: "contres / match",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "turnovers",
    label: "Ballons perdus",
    subtitle: "Plus de ballons perdus (moins = mieux)",
    valueUnit: "perGame",
    totalLabel: "BP",
    leaderUnit: "BP / match",
    lowerIsBetter: true,
    showInLeaders: false,
  },
  {
    key: "twoPointPct",
    label: "% tirs à 2 pts",
    subtitle: PERCENT_SUBTITLE,
    valueUnit: "percent",
    totalLabel: "tirs réussis",
    leaderUnit: "à 2 pts",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "threePointPct",
    label: "% tirs à 3 pts",
    subtitle: PERCENT_SUBTITLE,
    valueUnit: "percent",
    totalLabel: "tirs réussis",
    leaderUnit: "à 3 pts",
    lowerIsBetter: false,
    showInLeaders: true,
  },
  {
    key: "freeThrowPct",
    label: "% lancers francs",
    subtitle: PERCENT_SUBTITLE,
    valueUnit: "percent",
    totalLabel: "LF réussis",
    leaderUnit: "aux LF",
    lowerIsBetter: false,
    showInLeaders: true,
  },
];
