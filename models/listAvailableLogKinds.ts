import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { LOG_KINDS, type LogKind } from "@/models/LogKind";

/** Types de journal que le back sait servir, dans l'ordre de `LOG_KINDS`. */
export function listAvailableLogKinds(support: LogBackSupportTable = LOG_BACK_SUPPORT): readonly LogKind[] {
  return LOG_KINDS.filter((kind) => support[kind].available);
}
