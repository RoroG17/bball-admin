import type { Account } from "@/models/Account";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

/** Joueurs dont la licence ne figure dans aucun compte (comparaison stricte). Ordre d'entrée conservé. */
export function listPlayersWithoutAccount(
  players: readonly PlayerListEntry[],
  accounts: readonly Account[],
): PlayerListEntry[] {
  const taken = new Set(accounts.flatMap((account) => (account.player ? [account.player.licence] : [])));
  return players.filter((entry) => !taken.has(entry.player.licence));
}
