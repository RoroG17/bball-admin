import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import type { SeasonTeamCellData } from "@/models/SeasonRow";

type SeasonTeamCellProps = { cell: SeasonTeamCellData };

/** Équipe RPB de la saison : nom et logo, ou l'état dégradé en toutes lettres (icône + texte). */
export function SeasonTeamCell({ cell }: SeasonTeamCellProps) {
  switch (cell.kind) {
    case "named":
      return (
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo name={cell.name} logoUrl={cell.logoUrl} isRpb context="list" decorative />
          <span className="font-semibold wrap-anywhere">{cell.name}</span>
        </div>
      );
    case "none":
      return (
        <span className="inline-flex items-center gap-2 font-semibold">
          <AlertTriangleIcon size={18} strokeWidth={2.2} className="shrink-0 text-danger" />
          {SEASON_MESSAGES.teamNone}
        </span>
      );
    case "unknown":
      return <span className="font-semibold">{SEASON_MESSAGES.teamUnknown(cell.id)}</span>;
    case "unavailable":
      return <span className="font-semibold">{SEASON_MESSAGES.teamUnavailable(cell.id)}</span>;
  }
}
