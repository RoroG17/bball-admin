export type PlayerStatSortKey =
  | "name"
  | "minutes"
  | "points"
  | "rebounds"
  | "assists"
  | "steals"
  | "blocks"
  | "turnovers"
  | "fouls"
  | "twoPoints"
  | "threePoints"
  | "freeThrows";

export type SortDirection = "asc" | "desc";

export type PlayerStatSort = { key: PlayerStatSortKey; direction: SortDirection };

export type PlayerStatColumn = {
  key: PlayerStatSortKey;
  label: string;
  abbr: string;
  group: "main" | "shooting";
  /** Colonne affichée seulement avec « Tout » (P9). */
  allPeriodsOnly?: true;
};

export const PLAYER_STAT_COLUMNS: readonly PlayerStatColumn[] = [
  { key: "name", label: "Joueur", abbr: "Joueur", group: "main" },
  { key: "minutes", label: "Minutes jouées (total du match)", abbr: "Min", group: "main", allPeriodsOnly: true },
  { key: "points", label: "Points", abbr: "Pts", group: "main" },
  { key: "rebounds", label: "Rebonds", abbr: "Reb", group: "main" },
  { key: "assists", label: "Passes décisives", abbr: "PD", group: "main" },
  { key: "steals", label: "Interceptions", abbr: "Int", group: "main" },
  { key: "blocks", label: "Contres", abbr: "Ctr", group: "main" },
  { key: "turnovers", label: "Ballons perdus", abbr: "BP", group: "main" },
  { key: "fouls", label: "Fautes", abbr: "F", group: "main" },
  { key: "twoPoints", label: "Tirs à 2 points (réussis / tentés)", abbr: "2 pts", group: "shooting" },
  { key: "threePoints", label: "Tirs à 3 points (réussis / tentés)", abbr: "3 pts", group: "shooting" },
  { key: "freeThrows", label: "Lancers francs (réussis / tentés)", abbr: "LF", group: "shooting" },
];

export const DEFAULT_PLAYER_SORT: PlayerStatSort = { key: "name", direction: "asc" };
