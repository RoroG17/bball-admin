import type { LogContext } from "@/models/ErrorLogEntry";
import { formatLogContext } from "@/models/formatLogContext";
import { LOG_MESSAGES } from "@/models/logMessages";

type LogContextViewerProps = { context: LogContext | null };

/** Contexte libre en JSON indenté, texte brut, défilable au clavier. Police de la charte (DS112). */
export function LogContextViewer({ context }: LogContextViewerProps) {
  const formatted = formatLogContext(context);
  if (formatted === null) return <span className="font-normal text-rpb-ink/72">{LOG_MESSAGES.noContext}</span>;
  return (
    <div className="flex flex-col gap-1.5">
      <pre
        tabIndex={0}
        aria-label="Contexte (JSON)"
        className="max-h-80 overflow-auto rounded-lg border-2 border-rpb-ink bg-rpb-ink px-4 py-3.5 font-sans text-[13px]/5 font-normal whitespace-pre text-rpb-cream tabular-nums [tab-size:2] focus-ring"
      >
        {formatted.text}
      </pre>
      {formatted.truncated && (
        <p className="text-[13px]/5 font-normal text-rpb-ink/72">
          {LOG_MESSAGES.truncated(Array.from(formatted.text).length, formatted.totalChars)}
        </p>
      )}
    </div>
  );
}
