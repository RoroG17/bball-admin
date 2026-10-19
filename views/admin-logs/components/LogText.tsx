import { cx } from "@/lib/cx";
import { LOG_MESSAGES } from "@/models/logMessages";
import { sanitizeUntrustedText } from "@/models/sanitizeUntrustedText";
import { truncateText } from "@/models/truncateText";

type LogTextProps = {
  text: string;
  maxChars?: number;
  /** Zone de lecture focalisable pour un long texte (détail). */
  multiline?: boolean;
  className?: string;
};

/**
 * Texte d'un tiers, rendu UNIQUEMENT comme nœud texte : jamais de HTML interprété, jamais de lien automatique. Les
 * caractères de contrôle et bidirectionnels sont remplacés avant l'affichage.
 */
export function LogText({ text, maxChars, multiline = false, className }: LogTextProps) {
  const clean = sanitizeUntrustedText(text, { multiline });
  const cut = maxChars === undefined ? { text: clean, truncated: false, totalChars: 0 } : truncateText(clean, maxChars);

  if (multiline) {
    return (
      <div className={cx("flex flex-col gap-1.5", className)}>
        <div
          tabIndex={0}
          className="max-h-60 overflow-auto rounded-lg border-2 border-rpb-ink/14 px-3.5 py-3 text-[15px]/[22px] font-medium wrap-anywhere whitespace-pre-wrap focus-ring"
        >
          {cut.text}
        </div>
        {cut.truncated && (
          <p className="text-[13px]/5 text-rpb-ink/72">{LOG_MESSAGES.truncated(Array.from(cut.text).length, cut.totalChars)}</p>
        )}
      </div>
    );
  }
  return (
    <span className={className}>
      {cut.text}
      {cut.truncated ? "…" : ""}
    </span>
  );
}
