import { cx } from "@/lib/cx";
import { LOG_SOURCE_LABELS, type LogSource } from "@/models/LogSource";

type LogSourceBadgeProps = { source: LogSource };

/** Origine de l'erreur en texte : contour (serveur) ou plein bordeaux (client). */
export function LogSourceBadge({ source }: LogSourceBadgeProps) {
  const { label, hint } = LOG_SOURCE_LABELS[source];
  return (
    <span
      title={hint}
      className={cx(
        "inline-flex items-center rounded-full py-0.5 text-[13px]/5 font-bold whitespace-nowrap",
        source === "client" ? "bg-rpb-bordeaux px-2.5 text-rpb-cream" : "border-2 border-rpb-ink/30 px-2 py-0",
      )}
    >
      {label}
    </span>
  );
}
