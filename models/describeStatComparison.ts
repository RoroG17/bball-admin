import type { StatComparison } from "@/models/compareToAverage";

const COMPARISON_TEXT: Record<Exclude<StatComparison, "noAverage">, string> = {
  above: "au-dessus de",
  below: "en dessous de",
  equal: "égal à",
};

/** Texte accessible : « Points : 18, au-dessus de sa moyenne de saison (11,2) ». Valeurs déjà formatées (P16). */
export function describeStatComparison(label: string, value: string, comparison: StatComparison, average: string): string {
  if (comparison === "noAverage") return `${label} : ${value} (pas de moyenne)`;
  return `${label} : ${value}, ${COMPARISON_TEXT[comparison]} sa moyenne de saison (${average})`;
}
