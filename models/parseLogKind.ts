import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { DEFAULT_LOG_KIND, LOG_KIND_PARAMS, type LogKind } from "@/models/LogKind";
import { listAvailableLogKinds } from "@/models/listAvailableLogKinds";

/** `?type=` → type de journal. Casse stricte ; une valeur inconnue ou un type indisponible donne le type par défaut. */
export function parseLogKind(raw: string | undefined, support: LogBackSupportTable = LOG_BACK_SUPPORT): LogKind {
  return listAvailableLogKinds(support).find((kind) => LOG_KIND_PARAMS[kind] === raw) ?? DEFAULT_LOG_KIND;
}
