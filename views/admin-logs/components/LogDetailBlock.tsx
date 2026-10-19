import { CrossIcon } from "@/components/ui/icons/CrossIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { LogListQuery } from "@/models/LogListQuery";
import { buildLogListHref } from "@/models/buildLogListHref";
import { describeLogDetailTitle } from "@/models/describeLogDetailTitle";
import { findLogEntry } from "@/models/findLogEntry";
import { LOG_MESSAGES } from "@/models/logMessages";
import { listErrorLogs, listRequestLogs } from "@/repositories/LogRepository";
import { LogErrorDetail } from "@/views/admin-logs/components/LogErrorDetail";
import { LogRequestDetail } from "@/views/admin-logs/components/LogRequestDetail";

type LogDetailBlockProps = { query: LogListQuery };

const SECTION =
  "reveal flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-5 shadow-card";

/**
 * Détail d'une entrée = une ligne de la page courante (aucun appel de plus : la lecture est partagée avec la liste).
 * Une entrée absente de la page (purge, liste qui a bougé) n'est pas une erreur.
 */
export async function LogDetailBlock({ query }: LogDetailBlockProps) {
  const closeHref = buildLogListHref({ ...query, detailId: null });
  const detailId = query.detailId;
  if (detailId === null) return null;
  const closeButton = (
    <PrimaryButton variant="outline" size="tall" href={closeHref} prefetch={false}>
      <CrossIcon size={18} strokeWidth={2.5} className="shrink-0" />
      Fermer le détail
    </PrimaryButton>
  );

  const errorEntry =
    query.kind === "errors" ? findLogEntry((await listErrorLogs(query)).items, detailId) : null;
  const requestEntry =
    query.kind === "requests" ? findLogEntry((await listRequestLogs(query)).items, detailId) : null;
  const entry = errorEntry ?? requestEntry;

  if (entry === null) {
    return (
      <section id="detail" aria-labelledby="detail-title" className={SECTION}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="detail-title" tabIndex={-1} className="font-display text-xl leading-tight font-extrabold">
            Détail de l&apos;entrée
          </h2>
          {closeButton}
        </div>
        <SummaryNotice tone="light" message={LOG_MESSAGES.detailMissing} />
      </section>
    );
  }

  return (
    <section id="detail" aria-labelledby="detail-title" className={SECTION}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="detail-title" tabIndex={-1} className="font-display text-xl leading-tight font-extrabold">
          {describeLogDetailTitle(query.kind, entry.id)}
        </h2>
        {closeButton}
      </div>
      {errorEntry ? <LogErrorDetail entry={errorEntry} /> : requestEntry ? <LogRequestDetail entry={requestEntry} /> : null}
    </section>
  );
}
