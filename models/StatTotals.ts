export type ShootingTotals = { made: number; attempted: number };

/** Agrégats toujours numériques (`null` compté 0). */
export type StatTotals = {
  points: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  twoPoints: ShootingTotals;
  threePoints: ShootingTotals;
  freeThrows: ShootingTotals;
  /** Tirs à 2 et 3 points. */
  fieldGoals: ShootingTotals;
};
