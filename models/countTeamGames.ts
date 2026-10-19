import type { GameTeamRef } from "@/models/GameTeamRef";
import type { Season } from "@/models/Season";
import type { Team } from "@/models/Team";

/**
 * Matchs supprimés avec l'équipe : union (par match) des matchs de ses saisons et des matchs où elle figure, par NOM
 * exact (le back n'expose pas les identifiants d'équipe, B-T2). Si le nom n'est pas unique, la partie « par nom » est
 * ambiguë : `null` (jamais un nombre partiel, D-T2).
 */
export function countTeamGames(
  team: Team,
  allTeams: readonly Team[],
  seasons: readonly Season[],
  games: readonly GameTeamRef[],
): number | null {
  if (allTeams.filter((candidate) => candidate.name === team.name).length > 1) return null;
  const seasonIds = new Set(seasons.filter((season) => season.teamId === team.id).map((season) => season.id));
  const gameIds = new Set<number>();
  for (const game of games) {
    if (seasonIds.has(game.seasonId) || game.homeName === team.name || game.awayName === team.name) {
      gameIds.add(game.gameId);
    }
  }
  return gameIds.size;
}
