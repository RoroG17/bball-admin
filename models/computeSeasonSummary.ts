import type { CalendarGame } from "@/models/CalendarGame";
import { computeAverage } from "@/models/computeAverage";
import type { SeasonSummary } from "@/models/SeasonSummary";

/**
 * Bilan calculé sur les mêmes entrées que la liste. Un nul compte dans les matchs joués et les points,
 * ni en victoire ni en défaite (comme le back de l'accueil). Les 0-0 passés et les matchs où le RPB
 * n'est pas reconnu sont exclus des calculs.
 */
export function computeSeasonSummary(entries: readonly CalendarGame[]): SeasonSummary {
  let remaining = 0;
  let scoreMissing = 0;
  let played = 0;
  let unresolved = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const { game, status, rpbSide, outcome } of entries) {
    if (status === "upcoming") remaining++;
    else if (status === "scoreMissing") scoreMissing++;
    else if (rpbSide === null) unresolved++;
    else {
      played++;
      const [rpb, opponent] = rpbSide === "home" ? [game.home, game.away] : [game.away, game.home];
      pointsFor += rpb.score;
      pointsAgainst += opponent.score;
      if (outcome === "win") wins++;
      else if (outcome === "loss") losses++;
      else if (outcome === "draw") draws++;
    }
  }

  const pointDifferential = pointsFor - pointsAgainst;
  return {
    scheduled: entries.length,
    remaining,
    scoreMissing,
    played,
    unresolved,
    wins,
    losses,
    draws,
    pointsFor,
    pointsAgainst,
    averageFor: computeAverage(pointsFor, played),
    averageAgainst: computeAverage(pointsAgainst, played),
    pointDifferential,
    averageDifferential: computeAverage(pointDifferential, played),
  };
}
