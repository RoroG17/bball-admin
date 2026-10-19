"use client";

import { useCallback, useId, useRef, useState } from "react";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AddMeasurementForm } from "@/views/player-detail/components/AddMeasurementForm";

type AddMeasurementDialogProps = {
  licence: string;
  /** Date du jour (`YYYY-MM-DD`, Paris), borne haute du champ date. */
  today: string;
};

/** `<dialog>` natif : focus piégé, Échap et retour du focus au déclencheur sont gérés par le navigateur. */
export function AddMeasurementDialog({ licence, today }: AddMeasurementDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [saved, setSaved] = useState(false);
  // Remonte le formulaire à chaque ouverture : saisie et erreurs repartent de zéro.
  const [openCount, setOpenCount] = useState(0);

  function open() {
    setSaved(false);
    setOpenCount((count) => count + 1);
    dialogRef.current?.showModal();
  }

  const close = useCallback(() => dialogRef.current?.close(), []);
  const handleSuccess = useCallback(() => {
    setSaved(true);
    dialogRef.current?.close();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span aria-live="polite">
        {saved && (
          <span className="pop inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-[13px]/[18px] font-bold text-rpb-cream">
            <CheckIcon size={13} strokeWidth={3} />
            Mesure enregistrée
          </span>
        )}
      </span>
      <PrimaryButton onClick={open}>
        <PlusIcon size={18} strokeWidth={2.5} className="shrink-0" />
        Ajouter une mesure
      </PrimaryButton>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="max-h-[calc(100dvh-32px)] w-[min(calc(100%-32px),480px)] m-auto overflow-y-auto rounded-lg border-2 border-rpb-ink bg-rpb-cream p-0 text-rpb-ink shadow-lift backdrop:bg-rpb-ink/60"
      >
        <div className="reveal">
          <div className="flex items-center justify-between gap-3 border-b-2 border-rpb-ink/14 px-5 py-3.5">
            <h2 id={titleId} className="font-display text-[22px] leading-[1.2] font-black">
              Ajouter une mesure
            </h2>
            <button
              type="button"
              onClick={close}
              className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md focus-ring hover:bg-rpb-gold-light"
            >
              <CrossIcon size={18} strokeWidth={2.5} />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
          <AddMeasurementForm
            key={openCount}
            licence={licence}
            today={today}
            onCancel={close}
            onSuccess={handleSuccess}
          />
        </div>
      </dialog>
    </div>
  );
}
