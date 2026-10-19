"use client";

import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type AuthErrorProps = { onRetry: () => void };

/** Erreur de rendu des pages de connexion (pattern « Erreur de page », DS81). Jamais le message technique. */
export function AuthError({ onRetry }: AuthErrorProps) {
  return (
    <main className="anim flex min-h-dvh flex-1 items-center justify-center px-5 py-10">
      <section
        role="alert"
        className="reveal shake flex w-full max-w-[560px] flex-col items-start gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card"
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon size={24} className="shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl leading-tight font-extrabold text-danger">
              Impossible d&apos;afficher cette page
            </h1>
            <p className="text-sm text-rpb-ink/72">Vérifie ta connexion puis réessaie.</p>
          </div>
        </div>
        <PrimaryButton onClick={onRetry}>Réessayer</PrimaryButton>
      </section>
    </main>
  );
}
