import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { getLogBackSupport } from "@/lib/getLogBackSupport";
import { LOG_KIND_LABELS } from "@/models/LogKind";
import type { RawLogQuery } from "@/models/RawLogQuery";
import { buildLogListHref } from "@/models/buildLogListHref";
import { getActiveLogFilters } from "@/models/getActiveLogFilters";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { listAvailableLogKinds } from "@/models/listAvailableLogKinds";
import { resolveLogListQuery } from "@/models/resolveLogListQuery";
import { requireAdmin } from "@/repositories/SessionRepository";
import { LogCoverageNotice } from "@/views/admin-logs/components/LogCoverageNotice";
import { LogDetailBlock } from "@/views/admin-logs/components/LogDetailBlock";
import { LogFilterBar } from "@/views/admin-logs/components/LogFilterBar";
import { LogKindTabs } from "@/views/admin-logs/components/LogKindTabs";
import { LogListBlock } from "@/views/admin-logs/components/LogListBlock";
import { LogRetentionNotice } from "@/views/admin-logs/components/LogRetentionNotice";

type AdminLogsViewProps = { rawQuery: RawLogQuery };

/** Journaux de l'API, en lecture seule (D-ADM-4). Garde en première instruction ; redirection canonique avant tout Suspense. */
export async function AdminLogsView({ rawQuery }: AdminLogsViewProps) {
  await requireAdmin();
  const support = getLogBackSupport();
  const { query, redirectTo } = resolveLogListQuery(rawQuery, support);
  if (redirectTo) redirect(redirectTo);

  const kinds = listAvailableLogKinds(support);
  const labels = LOG_KIND_LABELS[query.kind];
  const listKey = buildLogListHref({ ...query, detailId: null });

  return (
    <main className="anim @container mx-auto flex max-w-[1200px] flex-col gap-7 px-5 pt-7 pb-16">
      <AdminPageHeader
        title="Journaux"
        breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "Journaux" }]}
      />
      <LogKindTabs kinds={kinds} current={query.kind} />
      <div className="flex flex-wrap gap-3">
        <div className="reveal min-w-0 flex-[1_1_280px]" style={{ animationDelay: "60ms" }}>
          <LogRetentionNotice />
        </div>
        <div className="reveal min-w-0 flex-[2_1_420px]" style={{ animationDelay: "100ms" }}>
          <LogCoverageNotice />
        </div>
      </div>
      <LogFilterBar query={query} activeFilters={getActiveLogFilters(query.kind, support)} maxDate={getParisIsoDate(new Date())} />
      <BlockErrorBoundary title={`Liste des ${labels.plural}`}>
        <Suspense key={listKey} fallback={<AdminTableSkeleton rows={8} />}>
          <LogListBlock query={query} />
        </Suspense>
      </BlockErrorBoundary>
      {query.detailId !== null && (
        <BlockErrorBoundary title="Détail de l'entrée">
          <Suspense key={buildLogListHref(query)} fallback={<AdminTableSkeleton rows={4} />}>
            <LogDetailBlock query={query} />
          </Suspense>
        </BlockErrorBoundary>
      )}
    </main>
  );
}
