import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";

type FormAlertProps = { message: string };

/** Erreur globale d'un formulaire, annoncée immédiatement (icône + texte, jamais la couleur seule). */
export function FormAlert({ message }: FormAlertProps) {
  return (
    <div
      role="alert"
      className="shake flex items-start gap-2.5 rounded-lg border-2 border-danger px-3.5 py-3 text-sm font-semibold text-danger"
    >
      <AlertTriangleIcon size={20} strokeWidth={2.2} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
