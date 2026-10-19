/**
 * `fn` sur chaque élément, au plus `limit` appels simultanés (< 1 compte pour 1). L'ordre du résultat est celui de
 * `items`. La première erreur de `fn` est propagée. Évite qu'un `Promise.all` de dizaines de lectures lourdes sature le back.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  const workerCount = Math.min(Math.max(1, Math.floor(limit) || 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
