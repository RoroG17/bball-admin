"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { initPassword } from "@/actions/authActions";
import { FormAlert } from "@/components/ui/FormAlert";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { InitPasswordField } from "@/models/InitPasswordInput";
import type { InitPasswordState } from "@/models/InitPasswordState";
import { PASSWORD_RULE_TEXT } from "@/models/PasswordRule";

type InitPasswordFormProps = {
  /** Identifiant lu dans le cookie d'activation : affiché seulement, jamais renvoyé par le formulaire. */
  username: string;
  redirectTo: string;
};

const IDLE: InitPasswordState = { status: "idle" };
const FIELD_ORDER: InitPasswordField[] = ["password", "confirmation"];

export function InitPasswordForm({ username, redirectTo }: InitPasswordFormProps) {
  const [state, formAction, pending] = useActionState(initPassword, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const ruleId = useId();
  const errors = state.status === "error" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status !== "error") return;
    const first = FIELD_ORDER.find((field) => state.fieldErrors[field]);
    if (first) formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }, [state]);

  return (
    <>
      <div className="flex flex-col gap-0.5 rounded-lg border-2 border-rpb-ink/14 px-3.5 py-2.5">
        <p className="text-[11px] font-semibold tracking-[.08em] text-rpb-ink/72 uppercase">Compte</p>
        <p className="text-base font-bold [overflow-wrap:anywhere]">{username}</p>
      </div>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
      >
        Ce n&apos;est pas toi ? Changer d&apos;identifiant
      </Link>
      <form ref={formRef} action={formAction} noValidate aria-busy={pending} className="flex flex-col gap-5">
        <p id={ruleId} className="flex items-start gap-2 text-sm tabular-nums">
          <InfoIcon size={18} className="mt-px shrink-0 text-rpb-bordeaux" />
          {PASSWORD_RULE_TEXT}
        </p>
        {state.status === "error" && state.message && <FormAlert message={state.message} />}
        {/* Pour les gestionnaires de mots de passe : associe le nouveau mot de passe au bon compte. Sans `name`. */}
        <input
          type="text"
          autoComplete="username"
          value={username}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
        <PasswordField
          label="Nouveau mot de passe"
          name="password"
          autoComplete="new-password"
          describedBy={ruleId}
          error={errors.password}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          name="confirmation"
          autoComplete="new-password"
          error={errors.confirmation}
        />
        <input type="hidden" name="redirect" value={redirectTo} />
        <PrimaryButton type="submit" size="lg" busy={pending}>
          <span className={pending ? "skeleton" : undefined}>
            {pending ? "Enregistrement…" : "Définir mon mot de passe"}
          </span>
        </PrimaryButton>
      </form>
    </>
  );
}
