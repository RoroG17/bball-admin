/** Garde la première occurrence de chaque licence, ordre conservé (doublons de la table `participer`, B4). */
export function dedupeByLicence<T extends { player: { licence: string } }>(entries: readonly T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.player.licence)) return false;
    seen.add(entry.player.licence);
    return true;
  });
}
