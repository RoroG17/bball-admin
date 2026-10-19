"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { FormAlert } from "@/components/ui/FormAlert";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IDLE_FORM_STATE, type ConfirmFormState } from "@/models/FormState";

type AdminConfirmFormProps = {
  action: (previous: ConfirmFormState, formData: FormData) => Promise<ConfirmFormState>;
  /** Champs cachés envoyés à l'action (identifiant de la cible). */
  fields: Readonly<Record<string, string>>;
  confirmLabel: string;
  busyLabel: string;
  cancelHref: string;
  /** `danger` (défaut) : suppression ; `neutral` : confirmation sans destruction (réinitialisation). */
  tone?: "danger" | "neutral";
};

/**
 * Confirmation d'une action sans champ. « Annuler » (un lien) précède l'action destructrice dans l'ordre DOM : elle
 * n'est jamais la première cible au clavier. Une seule soumission à la fois.
 */
export function AdminConfirmForm({
  action,
  fields,
  confirmLabel,
  busyLabel,
  cancelHref,
  tone = "danger",
}: AdminConfirmFormProps) {
  const [state, formAction, pending] = useActionState<ConfirmFormState, FormData>(action, IDLE_FORM_STATE);
  const submittedRef = useRef(false);

  // Un nouvel état (échec) rouvre la possibilité de confirmer à nouveau.
  useEffect(() => {
    submittedRef.current = false;
  }, [state]);

  function guardDoubleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending || submittedRef.current) {
      event.preventDefault();
      return;
    }
    submittedRef.current = true;
  }

  return (
    <form action={formAction} onSubmit={guardDoubleSubmit} aria-busy={pending || undefined} className="flex flex-col gap-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.status === "error" && state.message && <FormAlert message={state.message} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3 pt-1">
        <PrimaryButton variant="outline" size="lg" href={cancelHref}>
          Annuler
        </PrimaryButton>
        <PrimaryButton type="submit" size="lg" variant={tone === "danger" ? "danger" : "primary"} busy={pending}>
          {tone === "danger" && <TrashIcon size={18} strokeWidth={2.5} className="shrink-0" />}
          <span className={pending ? "skeleton" : undefined}>{pending ? busyLabel : confirmLabel}</span>
        </PrimaryButton>
      </div>
    </form>
  );
}
