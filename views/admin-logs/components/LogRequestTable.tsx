import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { AdminTable } from "@/components/admin/AdminTable";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { formatDurationMs } from "@/lib/format";
import type { LogListQuery } from "@/models/LogListQuery";
import type { RequestLogEntry } from "@/models/RequestLogEntry";
import { buildLogListHref } from "@/models/buildLogListHref";
import { describeLogEntry } from "@/models/describeLogEntry";
import { describeLogPlatform } from "@/models/describeLogPlatform";
import { describeLogUser } from "@/models/describeLogUser";
import { LOG_MESSAGES } from "@/models/logMessages";
import { LogStatusBadge } from "@/views/admin-logs/components/LogStatusBadge";
import { LogText } from "@/views/admin-logs/components/LogText";
import { LogTimestamp } from "@/views/admin-logs/components/LogTimestamp";

type LogRequestTableProps = { items: readonly RequestLogEntry[]; query: LogListQuery };

const SECONDARY = "hidden @min-[1120px]/tbl:table-cell";
const CODE =
  "inline-block max-w-[180px] rounded-[4px] border border-rpb-ink/14 px-1.5 font-sans text-[13px]/[18px] wrap-anywhere tabular-nums";

const COLUMNS: AdminColumn<RequestLogEntry>[] = [
  { id: "date", header: "Date", cell: (entry) => <LogTimestamp isoUtc={entry.occurredAt} /> },
  {
    id: "methode",
    header: "Méthode",
    cell: (entry) => (
      <code className={`${CODE} font-bold`}>
        <LogText text={entry.method} />
      </code>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: (entry) => (
      <code className={CODE}>
        <LogText text={entry.route} />
      </code>
    ),
  },
  { id: "statut", header: "Statut", cell: (entry) => <LogStatusBadge statusCode={entry.statusCode} /> },
  {
    id: "duree",
    header: "Durée",
    align: "end",
    cell: (entry) => <span className="whitespace-nowrap tabular-nums">{formatDurationMs(entry.durationMs)}</span>,
  },
  {
    id: "utilisateur",
    header: "Utilisateur",
    className: SECONDARY,
    cell: (entry) =>
      entry.user === null ? (
        <span className="text-rpb-ink/72 italic">{describeLogUser(null)}</span>
      ) : (
        <span className="wrap-anywhere">{describeLogUser(entry.user)}</span>
      ),
  },
  { id: "plateforme", header: "Plateforme", className: SECONDARY, cell: (entry) => describeLogPlatform(entry.platform, entry.os) },
];

/** Requêtes de la page : ni IP ni position en liste (visibles dans le détail seulement). */
export function LogRequestTable({ items, query }: LogRequestTableProps) {
  return (
    <AdminTable
      caption={LOG_MESSAGES.tableCaption.requests}
      columns={COLUMNS}
      rows={items}
      getRowKey={(entry) => String(entry.id)}
      sort={{ column: "date", direction: "desc" }}
      buildSortHref={() => ""}
      minWidth="lg"
      compact
      isRowHighlighted={(entry) => entry.id === query.detailId}
      rowActions={(entry) => {
        const subject = describeLogEntry("requests", entry.occurredAt);
        const open = entry.id === query.detailId;
        return (
          <AdminRowAction
            href={`${buildLogListHref({ ...query, detailId: entry.id })}#detail`}
            label={open ? "Ouvert" : "Détail"}
            subject={subject}
            accessibleName={open ? `Détail de ${subject} (ouvert)` : undefined}
            current={open}
            prefetch={false}
            icon={open ? <ChevronDownIcon size={16} strokeWidth={2.5} /> : <ChevronRightIcon size={16} strokeWidth={2.5} />}
          />
        );
      }}
    />
  );
}
