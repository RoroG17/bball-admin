import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { GroupIcon } from "@/components/ui/icons/GroupIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PLAYER_DETAIL_MAIN_CLASSES } from "@/views/player-detail/components/playerDetailLayout";

/** Licence invalide, joueur inexistant ou fiche non accessible (Q3) : même page, sans rien révéler. */
export function PlayerNotFound() {
  return (
    <main className={`anim ${PLAYER_DETAIL_MAIN_CLASSES}`}>
      <section className="reveal flex flex-col items-center gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream px-5 py-10 text-center shadow-card">
        <GroupIcon size={48} strokeWidth={1.6} className="text-rpb-bordeaux" />
        <h1 className="font-display text-[28px] leading-[1.1] font-black">Ce joueur n&apos;existe pas</h1>
        <p className="max-w-[44ch] text-[15px]/[22px] text-rpb-ink/72">
          Il a peut-être été supprimé, ou le lien est incorrect.
        </p>
        <PrimaryButton href="/player">
          <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
          Retour à l&apos;effectif
        </PrimaryButton>
      </section>
    </main>
  );
}
