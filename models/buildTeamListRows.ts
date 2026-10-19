import type { PlayerListEntry } from "@/models/PlayerListEntry";
import type { Season } from "@/models/Season";
import type { Team } from "@/models/Team";
import type { TeamListRow } from "@/models/TeamListRow";

/** Une ligne par équipe. Indicateur illisible (`null`) si sa source l'est. Ne trie pas. */
export function buildTeamListRows(
  teams: readonly Team[],
  seasons: readonly Season[] | null,
  players: readonly PlayerListEntry[] | null,
): TeamListRow[] {
  return teams.map((team) => ({
    team,
    clubSeasons: seasons === null ? null : seasons.filter((season) => season.teamId === team.id),
    playerCount: players === null ? null : players.filter((entry) => entry.team.id === team.id).length,
  }));
}
