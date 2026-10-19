import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { buildAdminHref } from "@/models/buildAdminHref";

type SeasonRowActionsProps = { seasonId: number; label: string };

/** « Modifier 2025-2026 · D1 · U15G » et « Supprimer … » : le nom accessible contient la saison. */
export function SeasonRowActions({ seasonId, label }: SeasonRowActionsProps) {
  return (
    <>
      <AdminRowAction
        href={buildAdminHref("season", { kind: "edit", id: seasonId })}
        label="Modifier"
        subject={label}
        icon={<PencilIcon size={16} strokeWidth={2.4} />}
      />
      <AdminRowAction
        href={buildAdminHref("season", { kind: "delete", id: seasonId })}
        label="Supprimer"
        subject={label}
        tone="danger"
        icon={<TrashIcon size={16} strokeWidth={2.4} />}
      />
    </>
  );
}
