"use client";

import { useRef, useTransition } from "react";
import { addSeasonParticipant, removeSeasonParticipant } from "@/actions/seasonActions";
import { cx } from "@/lib/cx";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import type { ParticipantActionResult, ParticipantIntent } from "@/models/ParticipantAction";
import { useParticipantFeedback } from "@/views/admin-season/components/participantFeedbackContext";

type ParticipantActionButtonProps = {
  intent: ParticipantIntent;
  seasonId: number;
  licence: string;
  /** Nom du joueur, annoncé dans le résultat. */
  playerName: string;
  /** Texte visible : « Inscrire », « Retirer ». */
  label: string;
  /** Nom accessible, avec le joueur : « Inscrire Lucas Marchand à la saison ». */
  accessibleLabel: string;
};

/**
 * Ajout ou retrait d'un participant : appel direct de l'action dans une transition (aucun formulaire), enregistré
 * immédiatement. Désactivé pendant l'appel ; une référence refuse aussi un second clic synchrone. Le résultat est annoncé
 * par `ParticipantsFeedback` (sans lui, le bouton ne fait rien).
 */
export function ParticipantActionButton({
  intent,
  seasonId,
  licence,
  playerName,
  label,
  accessibleLabel,
}: ParticipantActionButtonProps) {
  const feedback = useParticipantFeedback();
  const [pending, startTransition] = useTransition();
  const running = useRef(false);

  function handleClick() {
    if (!feedback || running.current) return;
    running.current = true;
    feedback.clear();
    startTransition(async () => {
      let result: ParticipantActionResult;
      try {
        const action = intent === "add" ? addSeasonParticipant : removeSeasonParticipant;
        result = await action({ seasonId, licence });
      } catch {
        result = { status: "error", message: ADMIN_MESSAGES.networkWrite };
      }
      running.current = false;
      feedback.report(result, playerName);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label={accessibleLabel}
      className={cx(
        "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border-2 px-4 text-sm font-bold whitespace-nowrap transition-colors focus-ring disabled:cursor-progress disabled:opacity-60",
        intent === "add"
          ? "border-rpb-bordeaux bg-rpb-bordeaux text-rpb-cream hover:bg-rpb-bordeaux-dark"
          : "border-rpb-bordeaux bg-rpb-cream text-rpb-bordeaux hover:bg-rpb-gold-light",
      )}
    >
      {label}
    </button>
  );
}
