import { formatDateTime, pluralize } from "@/lib/format";
import { LOG_KIND_LABELS, type LogKind } from "@/models/LogKind";

type LogResultSummaryProps = { kind: LogKind; total: number; readAt: Date };

/** « 134 erreurs · lues à 14:02:11 (heure de Paris) » : rappelle que la liste bouge. */
export function LogResultSummary({ kind, total, readAt }: LogResultSummaryProps) {
  const labels = LOG_KIND_LABELS[kind];
  const time = formatDateTime(readAt.toISOString(), "Europe/Paris").slice(-8);
  return (
    <p className="text-sm/5 font-semibold tabular-nums">
      {pluralize(total, labels.singular, labels.plural)}{" "}
      <span className="font-normal text-rpb-ink/72">
        · lues à {time} (heure de Paris)
      </span>
    </p>
  );
}
