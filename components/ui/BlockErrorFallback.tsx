"use client";

import type { ErrorInfo } from "next/error";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { cx } from "@/lib/cx";

export type BlockErrorFallbackProps = {
  title: string;
  /** Classes de placement du bloc dans la grille (largeur flex…). */
  className?: string;
};

/** Rendu d'un bloc en erreur. Utilisé par `BlockErrorBoundary` via `catchError`. */
export function BlockErrorFallback({ title, className }: BlockErrorFallbackProps, { retry }: ErrorInfo) {
  return (
    <section
      role="alert"
      className={cx(
        "shake flex min-w-0 flex-col gap-4 rounded-lg border-2 border-danger bg-rpb-cream p-5 shadow-card",
        className,
      )}
    >
      <h2 className="font-display text-xl leading-tight font-extrabold">{title}</h2>
      <div className="flex items-start gap-3">
        <AlertTriangleIcon size={24} className="shrink-0 text-danger" />
        <div className="flex flex-col gap-1">
          <p className="font-bold text-danger">Impossible de charger ce bloc</p>
          <p className="text-sm text-rpb-ink/72">Les autres blocs de la page restent disponibles.</p>
        </div>
      </div>
      <div>
        <PrimaryButton onClick={() => retry()}>Réessayer</PrimaryButton>
      </div>
    </section>
  );
}
