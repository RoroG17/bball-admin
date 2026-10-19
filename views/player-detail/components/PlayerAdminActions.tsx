import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { buildAdminHref } from "@/models/buildAdminHref";

type PlayerAdminActionsProps = { licence: string };

/** Rendu seulement pour un admin (décidé côté serveur) ; page d'édition : feature `admin-player`. */
export function PlayerAdminActions({ licence }: PlayerAdminActionsProps) {
  return (
    <nav aria-label="Actions administrateur" className="flex flex-wrap gap-2.5">
      <PrimaryButton variant="outline" href={buildAdminHref("player", { kind: "edit", id: licence })}>
        <PencilIcon size={18} className="shrink-0" />
        Modifier le joueur
      </PrimaryButton>
    </nav>
  );
}
