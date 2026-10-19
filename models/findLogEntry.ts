/** Première entrée d'identifiant `id`, sinon `null`. */
export function findLogEntry<T extends { id: number }>(items: readonly T[], id: number): T | null {
  return items.find((item) => item.id === id) ?? null;
}
