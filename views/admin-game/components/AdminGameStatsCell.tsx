import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import type { AdminGameRow } from "@/models/AdminGameRow";
import { ADMIN_GAME_STATS_LABELS, getAdminGameStatsLabel } from "@/models/getAdminGameStatsLabel";

type AdminGameStatsCellProps = { row: AdminGameRow };

/** « À saisir » (icône + texte), « Saisies », « — » (sans objet pour un lecteur d'écran) ou « Non vérifié ». */
export function AdminGameStatsCell({ row }: AdminGameStatsCellProps) {
  const label = getAdminGameStatsLabel(row);
  switch (label) {
    case "awaiting":
      return (
        <span className="inline-flex items-center gap-1.5 font-bold">
          <AlertTriangleIcon size={16} strokeWidth={2.2} className="shrink-0 text-danger" />
          {ADMIN_GAME_STATS_LABELS.awaiting}
        </span>
      );
    case "entered":
      return (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <CheckIcon size={16} strokeWidth={2.5} className="shrink-0 text-success" />
          {ADMIN_GAME_STATS_LABELS.entered}
        </span>
      );
    case "unknown":
      return (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <InfoIcon size={16} className="shrink-0" />
          {ADMIN_GAME_STATS_LABELS.unknown}
        </span>
      );
    case "notApplicable":
      return (
        <span>
          <span aria-hidden="true">{ADMIN_GAME_STATS_LABELS.notApplicable}</span>
          <span className="sr-only">Sans objet</span>
        </span>
      );
  }
}
