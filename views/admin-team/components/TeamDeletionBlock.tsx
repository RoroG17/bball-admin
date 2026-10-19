import { AdminConfirmForm } from "@/components/admin/AdminConfirmForm";
import { DeletionImpactList } from "@/components/admin/DeletionImpactList";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { deleteTeam } from "@/actions/teamActions";
import { buildAdminHref } from "@/models/buildAdminHref";
import { computeTeamDeletionImpact } from "@/models/computeTeamDeletionImpact";
import { describeTeamClubRole } from "@/models/describeTeamClubRole";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import type { Team } from "@/models/Team";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { listGameTeamRefs } from "@/repositories/GameRepository";
import { listAllPlayers } from "@/repositories/PlayerRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { listTeams } from "@/repositories/TeamRepository";
import { listAccountLicences } from "@/repositories/UserRepository";

type TeamDeletionBlockProps = {
  team: Team;
  token: string;
};

/**
 * Impact chiffré puis bouton de suppression. TOUTES les lectures sont requises : si l'une échoue le bloc lève, le
 * `BlockErrorBoundary` affiche « Réessayer » et le bouton n'est jamais rendu (impact illisible = pas de suppression).
 */
export async function TeamDeletionBlock({ team, token }: TeamDeletionBlockProps) {
  const [allTeams, seasons, players, accountLicences, games] = await Promise.all([
    listTeams(token),
    listAllSeasons(token),
    listAllPlayers(),
    listAccountLicences(token),
    listGameTeamRefs(),
  ]);
  const impact = computeTeamDeletionImpact({ team, allTeams, seasons, players, accountLicences, games });
  const clubRole = describeTeamClubRole(sortSeasonsByRecency(seasons.filter((season) => season.teamId === team.id)));

  return (
    <>
      {clubRole && <SummaryNotice tone="light" message={`${TEAM_MESSAGES.clubWarning} ${clubRole}.`} />}
      <DeletionImpactList impact={impact} />
      <AdminConfirmForm
        action={deleteTeam}
        fields={{ id: String(team.id) }}
        confirmLabel="Supprimer définitivement"
        busyLabel="Suppression…"
        cancelHref={buildAdminHref("team")}
      />
    </>
  );
}
