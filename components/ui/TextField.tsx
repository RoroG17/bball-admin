import { useId } from "react";
import { FieldError } from "@/components/ui/FieldError";
import { FIELD_CONTROL_CLASSES, describedByIds } from "@/lib/fieldControlClasses";

export type TextFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  autoCapitalize?: string;
  autoCorrect?: string;
  spellCheck?: boolean;
  maxLength?: number;
  /** `text` par défaut. Les mots de passe passent par `PasswordField`. */
  type?: "text" | "email" | "number" | "date" | "url" | "search" | "tel";
  /** Champ obligatoire : `aria-required` et étoile décorative après le libellé. */
  required?: boolean;
  readOnly?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "url" | "search" | "tel";
  /** Bornes d'un champ `number` ou `date` (nombre ou `YYYY-MM-DD`). */
  min?: number | string;
  max?: number | string;
};

/** Champ texte avec `<label>` associé, aide et erreur annoncées par `aria-describedby`. */
export function TextField({
  label,
  name,
  defaultValue,
  error,
  hint,
  type = "text",
  required,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-required={required ? true : undefined}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds(hint && hintId, error && errorId)}
        className={FIELD_CONTROL_CLASSES}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-[13px]/5 text-rpb-ink/72">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}
