import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { buildAdminHref } from "@/models/buildAdminHref";
import { buildPlayerHref } from "@/models/buildPlayerHref";

type PlayerCreatedLinksProps = { licence: string };

/** Suites possibles après la création : fiche, modification, autre création, retour à la liste. */
export function PlayerCreatedLinks({ licence }: PlayerCreatedLinksProps) {
  return (
    <nav aria-label="Suites possibles" className="reveal flex flex-wrap gap-3">
      <PrimaryButton href={buildAdminHref("player", "create")}>
        <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
        Créer un autre joueur
      </PrimaryButton>
      <PrimaryButton variant="outline" href={buildPlayerHref(licence)}>
        Voir la fiche
      </PrimaryButton>
      <PrimaryButton variant="outline" href={buildAdminHref("player", { kind: "edit", id: licence })}>
        <PencilIcon size={18} className="shrink-0" />
        Modifier
      </PrimaryButton>
      <PrimaryButton variant="outline" href={buildAdminHref("player")}>
        Retour à la liste
      </PrimaryButton>
    </nav>
  );
}
