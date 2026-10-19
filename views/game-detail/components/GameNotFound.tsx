import { BallIcon } from "@/components/ui/icons/BallIcon";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GAME_DETAIL_MAIN_CLASSES } from "@/views/game-detail/components/gameDetailLayout";

/** Identifiant invalide, match inexistant ou saison hors périmètre (D2) : même page. */
export function GameNotFound() {
  return (
    <main className={`anim ${GAME_DETAIL_MAIN_CLASSES}`}>
      <section className="reveal flex flex-col items-center gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream px-5 py-10 text-center shadow-card">
        <BallIcon size={48} filled className="ball" />
        <h1 className="font-display text-[28px] leading-[1.1] font-black">Ce match n&apos;existe pas</h1>
        <p className="max-w-[44ch] text-[15px]/[22px] text-rpb-ink/72">
          Il a peut-être été supprimé, ou le lien est incorrect.
        </p>
        <PrimaryButton href="/game">
          <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
          Retour au calendrier
        </PrimaryButton>
      </section>
    </main>
  );
}
