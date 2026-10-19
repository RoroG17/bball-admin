/** `[1, 3]` → `"Q2 et Q4"`, `[0, 1, 2]` → `"Q1, Q2 et Q3"`. */
export function formatQuarterList(indexes: readonly number[]): string {
  const labels = indexes.map((index) => `Q${index + 1}`);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}
