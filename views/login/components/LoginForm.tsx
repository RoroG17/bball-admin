"use client";

import { useActionState, useEffect, useRef } from "react";
import { login } from "@/actions/authActions";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import type { LoginState } from "@/models/LoginState";

type LoginFormProps = {
  /** Page où revenir après la connexion, déjà assainie. */
  redirectTo: string;
};

const IDLE: LoginState = { status: "idle" };

/**
 * Formulaire de connexion. Mot de passe facultatif : vide = première connexion (D2). Après une erreur, l'identifiant
 * est conservé, le mot de passe vidé, et le focus revient sur l'identifiant.
 */
export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLInputElement>('[name="username"]')?.focus();
  }, [state]);

  const error = state.status === "error" ? state : null;

  return (
    <form ref={formRef} action={formAction} noValidate aria-busy={pending} className="flex flex-col gap-5">
      {error && error.reason !== "invalidInput" && <FormAlert message={error.message} />}
      <TextField
        key={error?.values.username ?? ""}
        label="Identifiant"
        name="username"
        defaultValue={error?.values.username ?? ""}
        error={error?.fieldErrors.username}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={255}
        autoFocus
      />
      <PasswordField
        label="Mot de passe"
        name="password"
        autoComplete="current-password"
        hint="Première connexion ? Laisse le mot de passe vide."
      />
      <input type="hidden" name="redirect" value={redirectTo} />
      <PrimaryButton type="submit" size="lg" busy={pending}>
        <span className={pending ? "skeleton" : undefined}>{pending ? "Connexion en cours…" : "Se connecter"}</span>
      </PrimaryButton>
    </form>
  );
}
