"use client";

import { useState, type ChangeEvent } from "react";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { ArrowUpRightIcon } from "@/components/ui/icons/ArrowUpRightIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { buildYouTubeWatchUrl } from "@/lib/youtube";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { describeVideoFeedback } from "@/models/describeVideoFeedback";
import type { GameVideo } from "@/models/GameVideo";

type GameVideoFieldProps = {
  initialValue: string;
  /** Vidéo enregistrée : permet de reconnaître « inchangée » et de refuser un retrait que le back ignorerait (D-G5). */
  current: GameVideo;
};

/**
 * Champ « Vidéo YouTube » avec retour en direct (zone `aria-live`, icône + texte). Aucun lecteur intégré : aucune
 * requête vers YouTube avant une action de l'utilisateur (lien « Vérifier sur YouTube »).
 */
export function GameVideoField({ initialValue, current }: GameVideoFieldProps) {
  const [raw, setRaw] = useState(initialValue);
  const feedback = describeVideoFeedback(raw, current);

  function handleChange(event: ChangeEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === "video") setRaw(target.value);
  }

  return (
    <div onChange={handleChange} className="flex flex-col gap-2">
      <AdminTextField
        name="video"
        label="Vidéo YouTube"
        defaultValue={initialValue}
        hint={GAME_MESSAGES.videoHint}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />
      <div aria-live="polite" className="flex flex-col gap-1.5">
        {feedback && (
          <p className="flex items-start gap-2 text-sm font-semibold">
            {feedback.tone === "ok" ? (
              <CheckIcon size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <AlertTriangleIcon size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-danger" />
            )}
            <span>{feedback.text}</span>
          </p>
        )}
        {feedback?.videoId && (
          <a
            href={buildYouTubeWatchUrl(feedback.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Vérifier sur YouTube
            <ArrowUpRightIcon size={16} strokeWidth={2.4} className="shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
