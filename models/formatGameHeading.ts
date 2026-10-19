import type { Game } from "@/models/Game";

/** Contenu du `<h1>` : « Journée 9 : OTB – FAC Basket ». */
export function formatGameHeading(game: Game): string {
  return `Journée ${game.number} : ${game.home.name} – ${game.away.name}`;
}
