import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { LOG_FILTER_KEYS, LOG_TARGET_FILTERS, type LogFilterKey } from "@/models/LogFilters";
import type { LogKind } from "@/models/LogKind";

/**
 * Filtres proposés par l'écran ET appliqués par le back, dans l'ordre canonique. Source de vérité de l'interface et de
 * l'URL : un filtre inactif en est retiré (un ancien lien n'affiche jamais une liste faussement filtrée, D-L2).
 */
export function getActiveLogFilters(
  kind: LogKind,
  support: LogBackSupportTable = LOG_BACK_SUPPORT,
): readonly LogFilterKey[] {
  return LOG_FILTER_KEYS.filter((key) => LOG_TARGET_FILTERS[kind].includes(key) && support[kind].filters.includes(key));
}
