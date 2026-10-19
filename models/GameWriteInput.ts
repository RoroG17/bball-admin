/** Modèle d'écriture, séparé du modèle de lecture `Game`. Un champ de plus (heure, lieu…) = une clé ici. */
export type GameValues = { seasonId: number; round: number; date: string; homeTeamId: number; awayTeamId: number };
/** 0 / 0 = match non joué. */
export type GameScores = { home: number; away: number };
export type GameUpdateInput = GameValues & { scores: GameScores; video: string | null };
