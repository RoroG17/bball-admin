import { formatDurationMs } from "@/lib/format";
import type { RequestLogEntry } from "@/models/RequestLogEntry";
import { describeLogPlatform } from "@/models/describeLogPlatform";
import { describeLogPosition } from "@/models/describeLogPosition";
import { describeLogUser } from "@/models/describeLogUser";
import { LOG_MESSAGES } from "@/models/logMessages";
import { LogDetailField } from "@/views/admin-logs/components/LogDetailField";
import { LogStatusBadge } from "@/views/admin-logs/components/LogStatusBadge";
import { LogText } from "@/views/admin-logs/components/LogText";
import { LogTimestamp } from "@/views/admin-logs/components/LogTimestamp";

type LogRequestDetailProps = { entry: RequestLogEntry };

/** Tous les champs d'une requête. L'IP et la position n'apparaissent QUE ici (jamais en liste, P3). */
export function LogRequestDetail({ entry }: LogRequestDetailProps) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-6 gap-y-4">
      <LogDetailField label="Date">
        <LogTimestamp isoUtc={entry.occurredAt} showUtc />
      </LogDetailField>
      <LogDetailField label="Méthode">
        <code className="font-sans font-bold">
          <LogText text={entry.method} />
        </code>
      </LogDetailField>
      <LogDetailField label="Route">
        <LogText text={entry.route} />
      </LogDetailField>
      <LogDetailField label="Statut">
        <LogStatusBadge statusCode={entry.statusCode} />
      </LogDetailField>
      <LogDetailField label="Durée">
        <span className="tabular-nums">{formatDurationMs(entry.durationMs)}</span>
        <small className="block text-[13px]/5 font-normal text-rpb-ink/72">{LOG_MESSAGES.durationHint}</small>
      </LogDetailField>
      <LogDetailField label="Utilisateur">
        {describeLogUser(entry.user)}
        {entry.user === null && (
          <small className="block text-[13px]/5 font-normal text-rpb-ink/72">{LOG_MESSAGES.noUser}</small>
        )}
      </LogDetailField>
      <LogDetailField label="Plateforme / système">{describeLogPlatform(entry.platform, entry.os)}</LogDetailField>
      <LogDetailField label={LOG_MESSAGES.ipLabel}>
        {entry.ipAddress === null ? LOG_MESSAGES.ipMissing : <LogText text={entry.ipAddress} />}
        <small className="block text-[13px]/5 font-normal text-rpb-ink/72">{LOG_MESSAGES.ipNote}</small>
      </LogDetailField>
      <LogDetailField label="Position">
        {entry.position === null ? LOG_MESSAGES.noPosition : describeLogPosition(entry.position)}
      </LogDetailField>
    </dl>
  );
}
