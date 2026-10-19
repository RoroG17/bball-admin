"use client";

import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PLAYER_DETAIL_MAIN_CLASSES } from "@/views/player-detail/components/playerDetailLayout";

type PlayerDetailErrorProps = { onRetry: () => void };

/** Erreur de page (session, profil illisible, réseau). Le message technique n'est jamais affiché. */
export function PlayerDetailError({ onRetry }: PlayerDetailErrorProps) {
  return (
    <main className={PLAYER_DETAIL_MAIN_CLASSES}>
      <section
        role="alert"
        className="flex flex-col items-start gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon size={24} className="shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-extrabold text-danger">Impossible de charger ce joueur</h1>
            <p className="text-sm text-rpb-ink/72">Vérifie ta connexion puis réessaie.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <PrimaryButton onClick={onRetry}>Réessayer</PrimaryButton>
          <PrimaryButton variant="outline" href="/player">
            <ChevronLeftIcon size={18} strokeWidth={2.5} className="shrink-0" />
            Retour à l&apos;effectif
          </PrimaryButton>
        </div>
      </section>
    </main>
  );
}
