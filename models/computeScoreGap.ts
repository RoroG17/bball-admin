import type { CalendarGame } from "@/models/CalendarGame";

export type ScoreGap = { officialPoints: number; statsPoints: number; difference: number };

/** Écart entre le score officiel du RPB et la somme des points saisis (P7, D9). `null` hors match joué ou côté inconnu. */
export function computeScoreGap({ game, status, rpbSide }: CalendarGame, statsPoints: number): ScoreGap | null {
  if (status !== "played" || rpbSide === null) return null;
  const officialPoints = rpbSide === "home" ? game.home.score : game.away.score;
  return { officialPoints, statsPoints, difference: officialPoints - statsPoints };
}
