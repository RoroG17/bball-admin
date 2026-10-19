import { useId } from "react";
import { FieldError } from "@/components/ui/FieldError";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { FIELD_CONTROL_CLASSES, describedByIds } from "@/lib/fieldControlClasses";

export type SelectOption = { value: string; label: string };

export type SelectFieldProps = {
  label: string;
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Libellé d'une première option sans valeur (« Choisir… »). Absent : aucune option vide. */
  placeholder?: string;
};

/** Liste déroulante native avec `<label>` associé, aide et erreur annoncées par `aria-describedby`. */
export function SelectField({
  label,
  name,
  options,
  defaultValue,
  error,
  hint,
  required,
  placeholder,
}: SelectFieldProps) {
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
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
          required={required}
          aria-required={required ? true : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds(hint && hintId, error && errorId)}
          className={`${FIELD_CONTROL_CLASSES} cursor-pointer pr-11`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={18}
          strokeWidth={2.5}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-rpb-ink"
        />
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
