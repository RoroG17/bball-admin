import { pluralize } from "@/lib/format";
import { IMPACT_LABELS, type ImpactLine } from "@/models/DeletionImpact";

/** `« 12 matchs »`, `« 1 match »`, ou `« un nombre indéterminé de matchs »` si non calculable. Ne pas appeler pour 0. */
export function describeImpactLine(line: ImpactLine): string {
  const label = IMPACT_LABELS[line.kind];
  if (line.count === null) return `un nombre indéterminé de ${label.other}`;
  return pluralize(line.count, label.one, label.other);
}
