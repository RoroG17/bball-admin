import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";

type AccountPasswordStatusProps = { hasPassword: boolean };

/** « Défini » / « Non défini » : le sens passe par le texte, l'icône est décorative. */
export function AccountPasswordStatus({ hasPassword }: AccountPasswordStatusProps) {
  const Icon = hasPassword ? CheckIcon : AlertTriangleIcon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
      <Icon size={16} strokeWidth={2.4} className={hasPassword ? "text-success" : "text-rpb-ink"} />
      {hasPassword ? ACCOUNT_MESSAGES.status.set : ACCOUNT_MESSAGES.status.unset}
    </span>
  );
}
