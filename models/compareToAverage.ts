export type StatComparison = "above" | "below" | "equal" | "noAverage";

/** Comparaison à la moyenne ARRONDIE à une décimale (ce qui est affiché) : « 11 » contre « moy. 11 » est égal. */
export function compareToAverage(value: number, average: number | null): StatComparison {
  if (average === null) return "noAverage";
  const rounded = Math.round(average * 10) / 10;
  if (value > rounded) return "above";
  if (value < rounded) return "below";
  return "equal";
}
