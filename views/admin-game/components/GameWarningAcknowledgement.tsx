"use client";

import { useId } from "react";
import { useAdminFormContext } from "@/components/admin/adminFormContext";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import type { GameAckField } from "@/models/GameFormField";
import { GAME_WARNING_ACK_LABELS } from "@/models/GameWarning";

type GameWarningAcknowledgementProps = { field: GameAckField };

/**
 * Avertissement à acquitter (deux temps, côté serveur). Erreur du champ `ack…` = texte de l'avertissement + case « Je
 * confirme » non cochée (cible ≥ 48 px). Avertissement déjà acquitté (`"on"` renvoyé) : champ caché, l'acquittement
 * survit à une nouvelle erreur de saisie. Sinon rien.
 */
export function GameWarningAcknowledgement({ field }: GameWarningAcknowledgementProps) {
  const form = useAdminFormContext();
  const textId = useId();
  const failed = form?.state.status === "error" ? form.state : null;
  const warning = failed?.fieldErrors[field];

  if (warning) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-lg border-2 border-rpb-ink bg-rpb-gold-light px-4 py-3 text-rpb-ink"
      >
        <p id={textId} className="flex items-start gap-2.5 text-[15px]/[22px] font-semibold">
          <AlertTriangleIcon size={20} strokeWidth={2.2} className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </p>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-base font-bold">
          <input
            type="checkbox"
            name={field}
            aria-describedby={textId}
            aria-invalid="true"
            className="size-6 shrink-0 cursor-pointer accent-rpb-bordeaux focus-ring"
          />
          {GAME_WARNING_ACK_LABELS[field]}
        </label>
      </div>
    );
  }
  if (failed?.values[field] === "on") return <input type="hidden" name={field} value="on" />;
  return null;
}
