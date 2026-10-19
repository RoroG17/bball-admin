"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";

type AdminNoticeProps = {
  /** Phrase finale, résolue par la vue serveur (jamais lue dans l'URL). */
  message: string;
  /** Liste sans `notice` ni `ref` : l'URL y est ramenée une fois le message affiché. */
  cleanHref: string;
};

const subscribeToNothing = () => () => {};

/**
 * Message de résultat après une écriture. Le conteneur `role="status"` est rendu vide, puis rempli après le montage
 * pour être annoncé par les lecteurs d'écran. Pas de disparition automatique (WCAG 2.2.1) : bouton « Fermer ».
 */
export function AdminNotice({ message, cleanHref }: AdminNoticeProps) {
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", cleanHref);
  }, [cleanHref]);

  return (
    <div role="status">
      {mounted && !dismissed && message !== "" && (
        <div className="reveal flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-rpb-ink bg-success px-4 py-3 text-rpb-cream shadow-card">
          <span className="pop flex size-8 shrink-0 items-center justify-center rounded-full bg-rpb-cream text-success">
            <CheckIcon size={20} strokeWidth={3} />
          </span>
          <p className="min-w-0 flex-[1_1_220px] text-base font-semibold wrap-anywhere">{message}</p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-rpb-cream px-3.5 text-sm font-bold text-rpb-cream transition-colors hover:bg-rpb-ink focus-ring"
          >
            <CrossIcon size={16} strokeWidth={2.5} />
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
