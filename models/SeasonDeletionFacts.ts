export type SeasonDeletionFacts = {
  gameCount: number;
  /** Joueurs distincts inscrits. */
  participantCount: number;
  /** `null` = non calculable (au moins un match illisible). Jamais un 0 de remplacement. */
  statLineCount: number | null;
};
