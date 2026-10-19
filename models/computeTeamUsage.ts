import { countTeamGames } from "@/models/countTeamGames";
import type { GameTeamRef } from "@/models/GameTeamRef";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import type { Season } from "@/models/Season";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import type { Team } from "@/models/Team";
import type { TeamUsage } from "@/models/TeamUsage";

type ComputeTeamUsageInput = {
  team: Team;
  allTeams: readonly Team[];
  seasons: readonly Season[];
  players: readonly PlayerListEntry[];
  games: readonly GameTeamRef[];
};

/** Usage d'une équipe pour mesurer l'effet d'un renommage. Pas de `canDelete` : aucun blocage (D-ADM-1). */
export function computeTeamUsage({ team, allTeams, seasons, players, games }: ComputeTeamUsageInput): TeamUsage {
  return {
    clubSeasons: sortSeasonsByRecency(seasons.filter((season) => season.teamId === team.id)),
    playerCount: players.filter((entry) => entry.team.id === team.id).length,
    gameCount: countTeamGames(team, allTeams, seasons, games),
  };
}
