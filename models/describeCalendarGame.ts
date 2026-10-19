import { formatGameDate } from "@/lib/format";
import type { CalendarGame } from "@/models/CalendarGame";

const RESULT_TEXT = { win: "victoire", loss: "défaite", draw: "match nul" } as const;

/**
 * Nom accessible concis d'un match du calendrier, du point de vue du RPB quand son côté est connu :
 * « RPB contre OTB, journée 5, samedi 10 janvier 2026, victoire 78 à 65 ».
 */
export function describeCalendarGame({ game, status, rpbSide, outcome }: CalendarGame): string {
  const [first, second] = rpbSide === "away" ? [game.away, game.home] : [game.home, game.away];
  const base = `${first.name} contre ${second.name}, journée ${game.number}, ${formatGameDate(game.date)}`;

  if (status === "scoreMissing") return `${base}, score à saisir`;
  if (status === "upcoming") {
    const venue = rpbSide === "home" ? ", à domicile" : rpbSide === "away" ? ", à l'extérieur" : "";
    return `${base}, à venir${venue}`;
  }
  const result = outcome === "win" || outcome === "loss" || outcome === "draw" ? `${RESULT_TEXT[outcome]} ` : "";
  return `${base}, ${result}${first.score} à ${second.score}`;
}
