import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";

type FieldErrorProps = { id: string; message: string };

/** Erreur de champ : icône + texte (jamais la couleur seule), liée au champ par `aria-describedby`. */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
      <AlertTriangleIcon size={16} strokeWidth={2.2} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}
