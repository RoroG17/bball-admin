import type { Account } from "@/models/Account";
import { formatPlayerName } from "@/models/formatPlayerName";

/** Nom du joueur, sinon sa licence (joueur sans nom), sinon l'identifiant. Sert aux titres et aux noms accessibles. */
export function getAccountLabel(account: Pick<Account, "username" | "player">): string {
  if (account.player === null) return account.username;
  return formatPlayerName(account.player) || account.player.licence;
}
