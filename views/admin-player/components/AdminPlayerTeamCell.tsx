import { TeamLogo } from "@/components/ui/TeamLogo";
import type { PlayerTeam } from "@/models/PlayerListEntry";

type AdminPlayerTeamCellProps = { team: PlayerTeam };

/** Logo (ou initiales, décoratif) et nom de l'équipe actuelle. */
export function AdminPlayerTeamCell({ team }: AdminPlayerTeamCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamLogo name={team.name} logoUrl={team.logoUrl} isRpb={false} context="list" decorative />
      <span className="max-w-[220px] text-sm/5 font-medium wrap-anywhere">{team.name}</span>
    </div>
  );
}
