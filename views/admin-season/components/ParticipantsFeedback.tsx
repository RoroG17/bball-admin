"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { cx } from "@/lib/cx";
import { describeParticipantChange } from "@/models/describeParticipantChange";
import type { ParticipantActionResult } from "@/models/ParticipantAction";
import {
  ParticipantFeedbackContext,
  type ParticipantFeedbackValue,
} from "@/views/admin-season/components/participantFeedbackContext";

type ParticipantsFeedbackProps = { children: ReactNode };

type Announcement = { tone: "success" | "error"; text: string; sequence: number };

/**
 * Zone d'annonce du dernier ajout ou retrait, placée AVANT les listes. Succès : `role="status"` ; échec : `role="alert"`.
 * Le focus passe à la zone après chaque résultat (le bouton cliqué disparaît quand la ligne change de liste ; sans cela
 * le focus tomberait sur `<body>`). Pas de disparition automatique (WCAG 2.2.1) : bouton « Fermer ».
 */
export function ParticipantsFeedback({ children }: ParticipantsFeedbackProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const sequence = useRef(0);
  const zoneRef = useRef<HTMLDivElement>(null);

  const report = useCallback((result: ParticipantActionResult, playerName: string) => {
    sequence.current += 1;
    setAnnouncement({
      tone: result.status === "success" ? "success" : "error",
      text: result.status === "success" ? describeParticipantChange(result.outcome, playerName) : result.message,
      sequence: sequence.current,
    });
  }, []);
  const clear = useCallback(() => setAnnouncement(null), []);
  const value = useMemo<ParticipantFeedbackValue>(() => ({ report, clear }), [report, clear]);

  const announcedSequence = announcement?.sequence;
  useEffect(() => {
    if (announcedSequence !== undefined) zoneRef.current?.focus();
  }, [announcedSequence]);

  return (
    <ParticipantFeedbackContext.Provider value={value}>
      {announcement && (
        <div
          ref={zoneRef}
          tabIndex={-1}
          role={announcement.tone === "success" ? "status" : "alert"}
          className={cx(
            "reveal flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 px-4 py-3 focus-ring",
            announcement.tone === "success"
              ? "border-rpb-ink bg-success text-rpb-cream"
              : "border-danger bg-rpb-cream text-danger",
          )}
        >
          {announcement.tone === "success" ? (
            <CheckIcon size={22} strokeWidth={3} className="shrink-0" />
          ) : (
            <AlertTriangleIcon size={22} strokeWidth={2.2} className="shrink-0" />
          )}
          <p className="min-w-0 flex-[1_1_220px] text-base font-semibold wrap-anywhere">{announcement.text}</p>
          <button
            type="button"
            onClick={clear}
            className={cx(
              "inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-3.5 text-sm font-bold transition-colors focus-ring",
              announcement.tone === "success"
                ? "border-rpb-cream text-rpb-cream hover:bg-rpb-ink"
                : "border-danger text-danger hover:bg-danger hover:text-rpb-cream",
            )}
          >
            <CrossIcon size={16} strokeWidth={2.5} />
            Fermer
          </button>
        </div>
      )}
      {children}
    </ParticipantFeedbackContext.Provider>
  );
}
