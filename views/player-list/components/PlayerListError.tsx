"use client";

import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PLAYER_LIST_MAIN_CLASSES } from "@/views/player-list/components/playerListLayout";

type PlayerListErrorProps = { onRetry: () => void };

/** Erreur de page (session, saisons, réseau). Le message technique n'est jamais affiché. */
export function PlayerListError({ onRetry }: PlayerListErrorProps) {
  return (
    <main className={PLAYER_LIST_MAIN_CLASSES}>
      <section
        role="alert"
        className="flex flex-col items-start gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon size={24} className="shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-extrabold text-danger">Impossible de charger les joueurs</h1>
            <p className="text-sm text-rpb-ink/72">Vérifie ta connexion puis réessaie.</p>
          </div>
        </div>
        <PrimaryButton onClick={onRetry}>Réessayer</PrimaryButton>
      </section>
    </main>
  );
}
