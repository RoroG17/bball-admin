import type { AdminColumn } from "@/components/admin/AdminColumn";
import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { AdminTable } from "@/components/admin/AdminTable";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import type { ErrorLogEntry } from "@/models/ErrorLogEntry";
import { LOG_LIST_MESSAGE_CHARS, type LogListQuery } from "@/models/LogListQuery";
import { buildLogListHref } from "@/models/buildLogListHref";
import { describeLogEntry } from "@/models/describeLogEntry";
import { describeLogPlatform } from "@/models/describeLogPlatform";
import { describeLogUser } from "@/models/describeLogUser";
import { LOG_MESSAGES } from "@/models/logMessages";
import { LogSourceBadge } from "@/views/admin-logs/components/LogSourceBadge";
import { LogStatusBadge } from "@/views/admin-logs/components/LogStatusBadge";
import { LogText } from "@/views/admin-logs/components/LogText";
import { LogTimestamp } from "@/views/admin-logs/components/LogTimestamp";

type LogErrorTableProps = { items: readonly ErrorLogEntry[]; query: LogListQuery };

const SECONDARY = "hidden @min-[1120px]/tbl:table-cell";

const COLUMNS: AdminColumn<ErrorLogEntry>[] = [
  { id: "date", header: "Date", cell: (entry) => <LogTimestamp isoUtc={entry.occurredAt} /> },
  { id: "source", header: "Source", cell: (entry) => <LogSourceBadge source={entry.source} /> },
  { id: "statut", header: "Statut", cell: (entry) => <LogStatusBadge statusCode={entry.statusCode} /> },
  {
    id: "message",
    header: "Message",
    cell: (entry) => (
      <LogText
        text={entry.message}
        maxChars={LOG_LIST_MESSAGE_CHARS}
        className="line-clamp-2 block max-w-[380px] min-w-[200px] wrap-anywhere"
      />
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: (entry) =>
      entry.route === null ? (
        "—"
      ) : (
        <code className="inline-block max-w-[180px] rounded-[4px] border border-rpb-ink/14 px-1.5 font-sans text-[13px]/[18px] wrap-anywhere tabular-nums">
          <LogText text={entry.route} />
        </code>
      ),
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

/** Erreurs de la page : aucune colonne triable (le back trie toujours par date décroissante), ni IP ni position. */
export function LogErrorTable({ items, query }: LogErrorTableProps) {
  return (
    <AdminTable
      caption={LOG_MESSAGES.tableCaption.errors}
      columns={COLUMNS}
      rows={items}
      getRowKey={(entry) => String(entry.id)}
      sort={{ column: "date", direction: "desc" }}
      buildSortHref={() => ""}
      minWidth="lg"
      compact
      isRowHighlighted={(entry) => entry.id === query.detailId}
      rowActions={(entry) => {
        const subject = describeLogEntry("errors", entry.occurredAt);
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
