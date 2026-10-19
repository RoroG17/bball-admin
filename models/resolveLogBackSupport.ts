import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { LOG_FILTER_KEYS } from "@/models/LogFilters";

/** Table « tout activé » : simule le back livré (B-LOG-1 à B-LOG-4). Réservée aux tests. */
export const LOG_BACK_SUPPORT_ALL: LogBackSupportTable = {
  errors: { available: true, filters: LOG_FILTER_KEYS },
  requests: { available: true, filters: LOG_FILTER_KEYS },
};

/**
 * Table de capacités à utiliser. `LOG_BACK_SUPPORT_OVERRIDE=all` n'est lu que si `NODE_ENV=test` : jamais en
 * développement ni en production, quelle que soit la variable.
 */
export function resolveLogBackSupport(env: {
  nodeEnv: string | undefined;
  override: string | undefined;
}): LogBackSupportTable {
  if (env.nodeEnv === "test" && env.override === "all") return LOG_BACK_SUPPORT_ALL;
  return LOG_BACK_SUPPORT;
}
