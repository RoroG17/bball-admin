import { LogContextViewer } from "@/views/admin-logs/components/LogContextViewer";
import { LogDetailField } from "@/views/admin-logs/components/LogDetailField";
import { LogSourceBadge } from "@/views/admin-logs/components/LogSourceBadge";
import { LogStatusBadge } from "@/views/admin-logs/components/LogStatusBadge";
import { LogText } from "@/views/admin-logs/components/LogText";
import { LogTimestamp } from "@/views/admin-logs/components/LogTimestamp";
import { LOG_DETAIL_MAX_CHARS } from "@/models/LogListQuery";
import { LOG_SOURCE_LABELS } from "@/models/LogSource";
import type { ErrorLogEntry } from "@/models/ErrorLogEntry";
import { describeLogPlatform } from "@/models/describeLogPlatform";
import { describeLogPosition } from "@/models/describeLogPosition";
import { describeLogUser } from "@/models/describeLogUser";
import { getDisplayedErrorMethod } from "@/models/getDisplayedErrorMethod";
import { LOG_MESSAGES } from "@/models/logMessages";

type LogErrorDetailProps = { entry: ErrorLogEntry };

/** Tous les champs d'une erreur, y compris ceux que la liste masque (utilisateur, plateforme, position, contexte). */
export function LogErrorDetail({ entry }: LogErrorDetailProps) {
  const method = getDisplayedErrorMethod(entry);
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-6 gap-y-4">
      <LogDetailField label="Date">
        <LogTimestamp isoUtc={entry.occurredAt} showUtc />
      </LogDetailField>
      <LogDetailField label="Source">
        <LogSourceBadge source={entry.source} />
        <small className="block text-[13px]/5 font-normal text-rpb-ink/72">{LOG_SOURCE_LABELS[entry.source].hint}</small>
      </LogDetailField>
      <LogDetailField label="Statut">
        <LogStatusBadge statusCode={entry.statusCode} />
      </LogDetailField>
      {method !== null && (
        <LogDetailField label="Méthode">
          <code className="font-sans font-bold">
            <LogText text={method} />
          </code>
        </LogDetailField>
      )}
      <LogDetailField label="Route">
        {entry.route === null ? "—" : <LogText text={entry.route} />}
      </LogDetailField>
      <LogDetailField label="Utilisateur">
        {describeLogUser(entry.user)}
        {entry.user === null && (
          <small className="block text-[13px]/5 font-normal text-rpb-ink/72">{LOG_MESSAGES.noUser}</small>
        )}
      </LogDetailField>
      <LogDetailField label="Plateforme / système">{describeLogPlatform(entry.platform, entry.os)}</LogDetailField>
      <LogDetailField label="Position">
        {entry.position === null ? LOG_MESSAGES.noPosition : describeLogPosition(entry.position)}
      </LogDetailField>
      <LogDetailField label="Message complet" wide>
        <LogText text={entry.message} maxChars={LOG_DETAIL_MAX_CHARS} multiline />
      </LogDetailField>
      <LogDetailField label="Contexte" wide>
        <LogContextViewer context={entry.context} />
      </LogDetailField>
    </dl>
  );
}
