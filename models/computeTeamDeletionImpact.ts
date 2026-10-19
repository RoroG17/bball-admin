import { countTeamGames } from "@/models/countTeamGames";
import type { DeletionImpact, ImpactLine } from "@/models/DeletionImpact";
import type { GameTeamRef } from "@/models/GameTeamRef";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import type { Season } from "@/models/Season";
import type { Team } from "@/models/Team";

type ComputeTeamDeletionImpactInput = {
  team: Team;
  allTeams: readonly Team[];
  seasons: readonly Season[];
  players: readonly PlayerListEntry[];
  accountLicences: readonly string[];
  games: readonly GameTeamRef[];
};

/**
 * Ce que la suppression emporte (cascade complète, D-ADM-1). Un compteur impossible à établir vaut `null`, jamais un 0
 * faux : les lignes de stats, examens et mesures des joueurs ne sont pas comptables sans un appel par joueur (B-ADM-6).
 */
export function computeTeamDeletionImpact({
  team,
  allTeams,
  seasons,
  players,
  accountLicences,
  games,
}: ComputeTeamDeletionImpactInput): DeletionImpact {
  const teamPlayers = players.filter((entry) => entry.team.id === team.id);
  const licences = new Set(teamPlayers.map((entry) => entry.player.licence));
  const accountCount = new Set(accountLicences.filter((licence) => licences.has(licence))).size;
  const seasonCount = seasons.filter((season) => season.teamId === team.id).length;
  const gameCount = countTeamGames(team, allTeams, seasons, games);
  const playerCount = teamPlayers.length;

  const lines: ImpactLine[] = [
    { kind: "player", count: playerCount },
    { kind: "account", count: accountCount },
    { kind: "season", count: seasonCount },
    { kind: "game", count: gameCount },
    { kind: "participation", count: seasonCount === 0 && playerCount === 0 ? 0 : null },
    { kind: "statLine", count: gameCount === 0 && playerCount === 0 ? 0 : null },
    { kind: "exam", count: playerCount === 0 ? 0 : null },
    { kind: "measurement", count: playerCount === 0 ? 0 : null },
  ];
  return { lines, complete: lines.every((line) => line.count !== null) };
}
