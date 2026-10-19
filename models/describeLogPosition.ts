import { formatFixedDecimal } from "@/lib/format";
import type { LogPosition } from "@/models/LogPosition";

/** `« 48,85660 ; 2,35220 »`, sans carte tierce (P3). */
export function describeLogPosition(position: LogPosition): string {
  return `${formatFixedDecimal(position.latitude, 5)} ; ${formatFixedDecimal(position.longitude, 5)}`;
}
