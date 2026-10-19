import { IMPACT_KINDS, type DeletionImpact, type ImpactKind } from "@/models/DeletionImpact";
import { describeImpactLine } from "@/models/describeImpactLine";

export type DeletionImpactSummary = {
  items: { kind: ImpactKind; text: string }[];
  hasUnknown: boolean;
  isIncomplete: boolean;
  isEmpty: boolean;
};

/** Écarte les lignes à 0, garde l'ordre de `IMPACT_KINDS` et signale les comptes inconnus ou partiels. */
export function summarizeDeletionImpact(impact: DeletionImpact): DeletionImpactSummary {
  const lines = impact.lines
    .filter((line) => line.count !== 0)
    .toSorted((a, b) => IMPACT_KINDS.indexOf(a.kind) - IMPACT_KINDS.indexOf(b.kind));
  return {
    items: lines.map((line) => ({ kind: line.kind, text: describeImpactLine(line) })),
    hasUnknown: lines.some((line) => line.count === null),
    isIncomplete: !impact.complete,
    isEmpty: lines.length === 0,
  };
}
