"use client";

import { useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { AdminFormContext } from "@/components/admin/adminFormContext";
import { FormAlert } from "@/components/ui/FormAlert";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IDLE_FORM_STATE, type FormState } from "@/models/FormState";

type AdminFormProps<F extends string> = {
  action: (previous: FormState<F>, formData: FormData) => Promise<FormState<F>>;
  submitLabel: string;
  /** Libellé pendant l'envoi : « Création… ». */
  busyLabel: string;
  /** « Annuler » est un lien : aucune action, aucune confirmation (D-T10). */
  cancelHref: string;
  children: ReactNode;
};

/**
 * Formulaire de création ou de modification. Validation par Zod côté action (`noValidate`) ; saisie conservée après
 * erreur ; focus sur le premier champ invalide, à défaut sur l'alerte ; une seule soumission à la fois.
 */
export function AdminForm<F extends string>({ action, submitLabel, busyLabel, cancelHref, children }: AdminFormProps<F>) {
  const [state, formAction, pending] = useActionState<FormState<F>, FormData>(action, IDLE_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    submittedRef.current = false;
    if (state.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? alertRef.current)?.focus();
  }, [state]);

  function guardDoubleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending || submittedRef.current) {
      event.preventDefault();
      return;
    }
    submittedRef.current = true;
  }

  return (
    <AdminFormContext.Provider value={{ state: state as FormState<string>, pending }}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={guardDoubleSubmit}
        noValidate
        aria-busy={pending || undefined}
        className="flex w-full max-w-[720px] min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-lg border-2 border-rpb-ink/14 bg-rpb-cream p-5 shadow-card"
      >
        <p className="text-[13px]/5 text-rpb-ink/72">Les champs marqués d&apos;une étoile (*) sont obligatoires.</p>
        {state.status === "error" && state.message && (
          <div ref={alertRef} tabIndex={-1} className="focus-ring rounded-lg">
            <FormAlert message={state.message} />
          </div>
        )}
        {state.status === "success" && (
          <p role="status" className="text-sm font-semibold text-success">
            {state.message}
          </p>
        )}
        {children}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3 pt-1">
          <PrimaryButton type="submit" size="lg" busy={pending}>
            <span className={pending ? "skeleton" : undefined}>{pending ? busyLabel : submitLabel}</span>
          </PrimaryButton>
          <PrimaryButton variant="outline" size="lg" href={cancelHref}>
            Annuler
          </PrimaryButton>
        </div>
      </form>
    </AdminFormContext.Provider>
  );
}
