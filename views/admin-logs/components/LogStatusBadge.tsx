import type { ReactNode } from "react";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { cx } from "@/lib/cx";
import { LOG_STATUS_CLASS_LABELS, type LogStatusClass } from "@/models/LogStatusClass";
import { classifyLogStatus } from "@/models/classifyLogStatus";
import { LOG_MESSAGES } from "@/models/logMessages";

type LogStatusBadgeProps = { statusCode: number | null };

const ICONS: Record<Exclude<LogStatusClass, "none">, ReactNode> = {
  success: <CheckIcon size={16} strokeWidth={2.6} />,
  redirect: <InfoIcon size={16} strokeWidth={2.6} />,
  clientError: <AlertTriangleIcon size={16} strokeWidth={2.6} />,
  serverError: <CrossIcon size={16} strokeWidth={2.6} />,
};

const CLASSES: Record<Exclude<LogStatusClass, "none">, string> = {
  success: "bg-success px-2.5 py-[3px] text-rpb-cream",
  redirect: "border-2 border-rpb-ink px-2 py-px",
  clientError: "border-2 border-rpb-ink bg-rpb-gold-light px-2 py-px text-rpb-ink",
  serverError: "bg-danger px-2.5 py-[3px] text-rpb-cream",
};

/** Code HTTP en icône + code + libellé de classe : le sens ne passe jamais par la couleur seule. */
export function LogStatusBadge({ statusCode }: LogStatusBadgeProps) {
  const statusClass = classifyLogStatus(statusCode);
  if (statusClass === "none") {
    return (
      <span>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{LOG_MESSAGES.noStatus}</span>
      </span>
    );
  }
  return (
    <span className={cx("inline-flex flex-col items-start rounded-lg whitespace-nowrap tabular-nums", CLASSES[statusClass])}>
      <span className="flex items-center gap-1.5 text-sm/5 font-extrabold">
        {ICONS[statusClass]}
        {statusCode}
      </span>
      <span className="text-xs/4 font-semibold">{LOG_STATUS_CLASS_LABELS[statusClass]}</span>
    </span>
  );
}
