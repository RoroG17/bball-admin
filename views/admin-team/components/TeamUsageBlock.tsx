import { computeTeamUsage } from "@/models/computeTeamUsage";
import type { Team } from "@/models/Team";
import { listGameTeamRefs } from "@/repositories/GameRepository";
import { listAllPlayers } from "@/repositories/PlayerRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { TeamUsageList } from "@/views/admin-team/components/TeamUsageList";

type TeamUsageBlockProps = {
  team: Team;
  token: string;
};

/** Usage de l'équipe. Toutes les lectures sont requises : un échec ne touche que ce bloc, le formulaire reste utilisable. */
export async function TeamUsageBlock({ team, token }: TeamUsageBlockProps) {
  const [allTeams, seasons, players, games] = await Promise.all([
    listTeams(token),
    listAllSeasons(token),
    listAllPlayers(),
    listGameTeamRefs(),
  ]);
  return <TeamUsageList usage={computeTeamUsage({ team, allTeams, seasons, players, games })} />;
}
