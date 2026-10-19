"use client";

import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type HallOfFameErrorProps = { onRetry: () => void };

/** Erreur globale : réseau, 5xx ou forme générale de la réponse invalide. */
export function HallOfFameError({ onRetry }: HallOfFameErrorProps) {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <section
        role="alert"
        className="flex flex-col items-start gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon size={24} className="shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-extrabold text-danger">Impossible de charger le palmarès</h1>
            <p className="text-sm text-rpb-ink/72">Vérifie ta connexion puis réessaie.</p>
          </div>
        </div>
        <PrimaryButton onClick={onRetry}>Réessayer</PrimaryButton>
      </section>
    </main>
  );
}
