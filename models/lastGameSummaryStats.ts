/** Stats comparées à la moyenne sur la synthèse « Son dernier match » (les minutes sont traitées à part). */
export const LAST_GAME_SUMMARY_STATS = ["points", "rebounds", "assists", "steals", "blocks"] as const;

export type LastGameSummaryStat = (typeof LAST_GAME_SUMMARY_STATS)[number];

export const LAST_GAME_SUMMARY_LABELS: Record<LastGameSummaryStat, string> = {
  points: "Points",
  rebounds: "Rebonds",
  assists: "Passes décisives",
  steals: "Interceptions",
  blocks: "Contres",
};
