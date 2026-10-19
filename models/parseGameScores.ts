import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { GameScores } from "@/models/GameWriteInput";

export type GameScoresResult =
  | ({ kind: "score" } & GameScores)
  | { kind: "invalid"; errors: { homeScore?: string; awayScore?: string } };

const SCORE = /^\d{1,3}$/;

/**
 * Deux scores saisis ensemble. Les deux vides = match non joué (`0` / `0`). Un seul vide = erreur sur le champ vide :
 * un vide n'est jamais transformé en 0 en silence. Négatif, décimal, `1e3`, 4 chiffres : refusés (D-G6).
 */
export function parseGameScores(homeRaw: string, awayRaw: string): GameScoresResult {
  const home = homeRaw.trim();
  const away = awayRaw.trim();
  if (home === "" && away === "") return { kind: "score", home: 0, away: 0 };

  const errors: { homeScore?: string; awayScore?: string } = {};
  if (home === "") errors.homeScore = GAME_MESSAGES.scoreMissingOther;
  else if (!SCORE.test(home)) errors.homeScore = GAME_MESSAGES.scoreInvalid;
  if (away === "") errors.awayScore = GAME_MESSAGES.scoreMissingOther;
  else if (!SCORE.test(away)) errors.awayScore = GAME_MESSAGES.scoreInvalid;

  return Object.keys(errors).length > 0
    ? { kind: "invalid", errors }
    : { kind: "score", home: Number(home), away: Number(away) };
}
