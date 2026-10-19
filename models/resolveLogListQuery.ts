import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import type { LogListQuery } from "@/models/LogListQuery";
import type { RawLogQuery } from "@/models/RawLogQuery";
import { buildLogListHref } from "@/models/buildLogListHref";
import { parseLogListQuery } from "@/models/parseLogListQuery";

function sortedPairs(pairs: readonly string[][]): string {
  return JSON.stringify([...pairs].sort((a, b) => (a[0] + "\u0000" + a[1]).localeCompare(b[0] + "\u0000" + b[1])));
}

/**
 * Requête de liste + URL canonique à rejoindre, ou `null` si l'URL l'est déjà. Compare l'ENSEMBLE des couples
 * (clé, valeur) reçus (une paire par valeur d'une clé répétée) à celui de la forme canonique : l'ordre des paramètres
 * seul ne redirige pas. Idempotente : l'URL canonique se résout en `null` (aucune boucle).
 */
export function resolveLogListQuery(
  raw: RawLogQuery,
  support: LogBackSupportTable = LOG_BACK_SUPPORT,
): { query: LogListQuery; redirectTo: string | null } {
  const query = parseLogListQuery(raw, support);
  const href = buildLogListHref(query);
  const received = Object.entries(raw).flatMap(([key, value]) =>
    value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((item) => [key, item]),
  );
  const canonical = [...new URLSearchParams(href.split("?")[1] ?? "").entries()].map(([key, value]) => [key, value]);
  return { query, redirectTo: sortedPairs(received) === sortedPairs(canonical) ? null : href };
}
