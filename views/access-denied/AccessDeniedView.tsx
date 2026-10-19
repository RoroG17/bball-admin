import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { LockIcon } from "@/components/ui/icons/LockIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

/**
 * Rendu de `forbidden()` (D6) : carte centrée avec `<h1>` (DS79), en-tête de l'app conservé. Pas de « 403 » affiché :
 * sous `loading.tsx`, le statut HTTP reste 200.
 */
export function AccessDeniedView() {
  return (
    <main className="anim mx-auto flex max-w-[1200px] flex-col items-center gap-7 px-5 pt-7 pb-16">
      <section
        aria-labelledby="denied-title"
        className="reveal flex w-full max-w-[560px] flex-col items-center gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream px-5 py-10 text-center shadow-card"
      >
        <LockIcon size={48} strokeWidth={1.8} className="text-rpb-bordeaux" />
        <h1 id="denied-title" className="font-display text-[28px] leading-[1.15] font-black">
          Accès refusé
        </h1>
        <p className="max-w-[44ch] text-[15px]/[22px] text-rpb-ink/72">Cette page est réservée aux administrateurs.</p>
        <PrimaryButton href="/">
          <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
          Retour au tableau de bord
        </PrimaryButton>
      </section>
    </main>
  );
}
