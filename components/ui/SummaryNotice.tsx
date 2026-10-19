import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { cx } from "@/lib/cx";

type SummaryNoticeProps = {
  message: string;
  /** `dark` : dans le bandeau du bilan ; `light` : sur fond crème. */
  tone: "dark" | "light";
  /** `check` : confirmation (ex. mot de passe défini, DS78) ; `alert` : avertissement non bloquant ; `info` par défaut. */
  icon?: "info" | "check" | "alert";
};

/** Mention informative statique (icône + texte, jamais la couleur seule). */
export function SummaryNotice({ message, tone, icon = "info" }: SummaryNoticeProps) {
  const Icon = icon === "check" ? CheckIcon : icon === "alert" ? AlertTriangleIcon : InfoIcon;
  return (
    <p
      className={cx(
        "flex items-start gap-2.5 rounded-md px-3.5 py-2.5 text-sm",
        tone === "dark" ? "border border-rpb-cream/22 text-rpb-cream" : "bg-rpb-gold-light text-rpb-ink",
      )}
    >
      <Icon
        size={18}
        strokeWidth={icon === "check" || icon === "alert" ? 2.2 : undefined}
        className={cx("mt-px shrink-0", tone === "dark" ? "text-rpb-gold" : "text-rpb-ink")}
      />
      <span>{message}</span>
    </p>
  );
}
