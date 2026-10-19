export type SeasonSummary = {
  /** Matchs programmés sur la saison (tous statuts). */
  scheduled: number;
  /** Matchs à venir. */
  remaining: number;
  /** Matchs passés restés à 0-0. */
  scoreMissing: number;
  /** Matchs joués dont le côté RPB est connu : base de tous les calculs ci-dessous. */
  played: number;
  /** Matchs joués non comptés, faute d'avoir reconnu l'équipe RPB. */
  unresolved: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Moyennes par match joué, `null` si `played === 0`. Pas d'arrondi ici. */
  averageFor: number | null;
  averageAgainst: number | null;
  /** pointsFor − pointsAgainst. */
  pointDifferential: number;
  averageDifferential: number | null;
};
