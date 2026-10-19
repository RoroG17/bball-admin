import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { LOG_KIND_LABELS } from "@/models/LogKind";
import type { LogListQuery } from "@/models/LogListQuery";
import type { Page } from "@/models/Page";
import { buildLogListHref } from "@/models/buildLogListHref";
import { LOG_MESSAGES } from "@/models/logMessages";
import { describeLogRetention } from "@/models/logRetention";
import { listErrorLogs, listRequestLogs } from "@/repositories/LogRepository";
import { LogErrorTable } from "@/views/admin-logs/components/LogErrorTable";
import { LogRequestTable } from "@/views/admin-logs/components/LogRequestTable";
import { LogResultSummary } from "@/views/admin-logs/components/LogResultSummary";

type LogListBlockProps = { query: LogListQuery };

/**
 * Liste d'une page de journal. Une lecture en échec fait échouer le bloc (« Réessayer ») : jamais une liste vide
 * trompeuse. Aucune redirection ici (le bloc est sous `Suspense`) : une page hors plage affiche un état dédié.
 */
export async function LogListBlock({ query }: LogListBlockProps) {
  const listHref = buildLogListHref({ ...query, detailId: null });
  const labels = LOG_KIND_LABELS[query.kind];
  const page: Page<unknown> = query.kind === "errors" ? await listErrorLogs(query) : await listRequestLogs(query);
  const isFiltered = Object.keys(query.filters).length > 0;

  if (page.total === 0) {
    return isFiltered ? (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title={LOG_MESSAGES.noMatchTitle}
        text={describeLogRetention()}
        action={{
          href: buildLogListHref({ kind: query.kind, filters: {}, page: 1, detailId: null }),
          label: "Réinitialiser les filtres",
          prefetch: false,
        }}
      />
    ) : (
      <AdminEmptyState
        kind="noMatch"
        icon={<InfoIcon size={40} strokeWidth={1.6} />}
        title={LOG_MESSAGES.emptyTitle[query.kind]}
        text={`${describeLogRetention()} ${LOG_MESSAGES.emptyPurgeHint}`}
        action={{ href: listHref, label: "Actualiser", prefetch: false }}
      />
    );
  }

  if (page.items.length === 0) {
    return (
      <AdminEmptyState
        kind="noMatch"
        icon={<SearchIcon size={40} strokeWidth={1.6} />}
        title={LOG_MESSAGES.pageGoneTitle}
        text={LOG_MESSAGES.pageGoneText}
        action={{
          href: buildLogListHref({ ...query, page: page.pageCount, detailId: null }),
          label: "Aller à la dernière page",
          prefetch: false,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <LogResultSummary kind={query.kind} total={page.total} readAt={new Date()} />
      {query.kind === "errors" ? (
        <LogErrorTable items={(page as Awaited<ReturnType<typeof listErrorLogs>>).items} query={query} />
      ) : (
        <LogRequestTable items={(page as Awaited<ReturnType<typeof listRequestLogs>>).items} query={query} />
      )}
      <AdminPagination
        page={page}
        buildHref={(target) => buildLogListHref({ ...query, page: target, detailId: null })}
        unit={{ singular: labels.singular, plural: labels.plural }}
      />
    </div>
  );
}
