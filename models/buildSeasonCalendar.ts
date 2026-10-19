import { compareGamesByDate } from "@/models/compareGamesByDate";
import type { Game } from "@/models/Game";
import type { RpbTeam } from "@/models/RpbTeam";
import type { SeasonCalendar } from "@/models/SeasonCalendar";
import { toCalendarGame } from "@/models/toCalendarGame";

/** Prochain match, puis « À venir » (croissant), puis « Résultats » (décroissant). Ne modifie pas `games`. */
export function buildSeasonCalendar(games: readonly Game[], rpbTeam: RpbTeam | null, today: string): SeasonCalendar {
  const entries = games.map((game) => toCalendarGame(game, rpbTeam, today));
  const [next = null, ...upcoming] = entries
    .filter((entry) => entry.status === "upcoming")
    .sort((a, b) => compareGamesByDate(a.game, b.game));
  const results = entries
    .filter((entry) => entry.status !== "upcoming")
    .sort((a, b) => compareGamesByDate(b.game, a.game));
  return { next, upcoming, results };
}
