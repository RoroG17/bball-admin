export const TEAM_STATS = ["points", "rebounds", "assists", "steals", "blocks", "turnovers", "fouls"] as const;

export type TeamStat = (typeof TEAM_STATS)[number];

export const TEAM_STAT_LABELS: Record<TeamStat, string> = {
  points: "Points",
  rebounds: "Rebonds",
  assists: "Passes décisives",
  steals: "Interceptions",
  blocks: "Contres",
  turnovers: "Ballons perdus",
  fouls: "Fautes",
};
