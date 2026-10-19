import type { CalendarGame } from "@/models/CalendarGame";

/** Titre de l'iframe : « Vidéo du match RPB contre OTB, journée 9 » (RPB d'abord quand son côté est connu). */
export function describeGameVideo({ game, rpbSide }: CalendarGame): string {
  const [first, second] = rpbSide === "away" ? [game.away, game.home] : [game.home, game.away];
  return `Vidéo du match ${first.name} contre ${second.name}, journée ${game.number}`;
}
