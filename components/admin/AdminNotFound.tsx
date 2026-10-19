import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { capitalizeFirst } from "@/lib/format";
import { ADMIN_ENTITY_NOUNS, type AdminEntity } from "@/models/AdminEntity";
import { buildAdminHref } from "@/models/buildAdminHref";

type AdminNotFoundProps = { entity: AdminEntity };

/** « Équipe introuvable » : identifiant inconnu ou invalide. Jamais de formulaire vide. */
export function AdminNotFound({ entity }: AdminNotFoundProps) {
  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col px-5 pt-7 pb-16">
      <section
        aria-labelledby="not-found-title"
        className="reveal flex w-full max-w-[560px] flex-col items-center gap-4 self-center rounded-lg border-2 border-rpb-ink bg-rpb-cream px-5 py-10 text-center shadow-card"
      >
        <SearchIcon size={48} strokeWidth={1.8} className="text-rpb-bordeaux" />
        <h1 id="not-found-title" className="font-display text-[28px] leading-[1.15] font-black">
          {capitalizeFirst(ADMIN_ENTITY_NOUNS[entity].singular)} introuvable
        </h1>
        <p className="text-[15px]/[22px] text-rpb-ink/72">Il n&apos;existe pas ou a été supprimé.</p>
        <PrimaryButton href={buildAdminHref(entity)}>
          <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
          Retour à la liste
        </PrimaryButton>
      </section>
    </main>
  );
}
