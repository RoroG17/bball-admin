/** Vrai si un autre joueur du classement a le même rang (ex æquo). */
export function isSharedRank(entries: readonly { rank: number }[], index: number): boolean {
  const rank = entries[index].rank;
  return entries[index - 1]?.rank === rank || entries[index + 1]?.rank === rank;
}
