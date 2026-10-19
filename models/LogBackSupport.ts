import type { LogFilterKey } from "@/models/LogFilters";
import type { LogKind } from "@/models/LogKind";

export type LogBackSupportTable = Record<LogKind, { available: boolean; filters: readonly LogFilterKey[] }>;

/**
 * Capacités du back déployé : SEUL endroit à modifier quand il évolue (B-LOG-1 à B-LOG-4). Chaque modification
 * s'accompagne d'une fixture réelle et d'un test d'URL prouvant que le back applique bien le filtre.
 * État du back au 12/10/2026 : `GET /api/logs/requests` n'est pas routée ; les erreurs n'acceptent que `platform`,
 * `os` et `source` (plus `user_id`, que la V2 n'utilise pas : D-L4).
 */
export const LOG_BACK_SUPPORT: LogBackSupportTable = {
  errors: { available: true, filters: ["plateforme", "os", "source"] },
  requests: { available: false, filters: ["plateforme", "os", "route", "du", "au"] },
};
