import type { LogContext } from "@/models/ErrorLogEntry";
import { LOG_DETAIL_MAX_CHARS } from "@/models/LogListQuery";
import { sanitizeUntrustedText } from "@/models/sanitizeUntrustedText";
import { truncateText } from "@/models/truncateText";

/** Contexte libre → JSON indenté de 2, tronqué à `maxChars` et assaini. `null` si aucun contexte. */
export function formatLogContext(
  context: LogContext | null,
  maxChars: number = LOG_DETAIL_MAX_CHARS,
): { text: string; truncated: boolean; totalChars: number } | null {
  if (context === null) return null;
  let json: string;
  try {
    json = JSON.stringify(context, null, 2);
  } catch {
    json = "[contexte illisible]";
  }
  const truncated = truncateText(json ?? "[contexte illisible]", maxChars);
  return { ...truncated, text: sanitizeUntrustedText(truncated.text, { multiline: true }) };
}
