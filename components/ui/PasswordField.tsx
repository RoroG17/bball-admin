"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FieldError } from "@/components/ui/FieldError";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";
import { EyeOffIcon } from "@/components/ui/icons/EyeOffIcon";
import { FIELD_CONTROL_CLASSES, describedByIds } from "@/lib/fieldControlClasses";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
  /** Ids supplémentaires pour `aria-describedby` (ex. règle de mot de passe affichée au-dessus). */
  describedBy?: string;
};

/**
 * Mot de passe masquable. Le bouton « Afficher » est à côté du champ (DS75) ; le champ repasse en masqué à l'envoi
 * du formulaire. Jamais de valeur par défaut : un mot de passe n'est jamais pré-rempli.
 */
export function PasswordField({ label, name, autoComplete, error, hint, describedBy }: PasswordFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds(describedBy, hint && hintId, error && errorId)}
          className={`${FIELD_CONTROL_CLASSES} flex-1`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 border-rpb-ink bg-rpb-cream px-3 text-[15px] font-semibold text-rpb-ink hover:bg-rpb-gold-light focus-ring aria-pressed:bg-rpb-bordeaux aria-pressed:text-rpb-cream"
        >
          {visible ? <EyeOffIcon size={20} strokeWidth={2.2} /> : <EyeIcon size={20} strokeWidth={2.2} />}
          <span aria-hidden="true">{visible ? "Masquer" : "Afficher"}</span>
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-[13px]/5 text-rpb-ink/72">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}
