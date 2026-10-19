import type { Account } from "@/models/Account";
import type { SortState } from "@/models/AdminListQuery";
import { compareText } from "@/models/compareText";
import { sortRows } from "@/models/sortRows";

/** Un compte sans joueur est « plus grand » que tout joueur : en dernier en `asc`, en premier en `desc`. */
function comparePlayers(a: Account, b: Account): number {
  if (a.player === null || b.player === null) return a.player === b.player ? 0 : a.player === null ? 1 : -1;
  return compareText(a.player.lastName, b.player.lastName) || compareText(a.player.firstName, b.player.firstName);
}

function compareUsernames(a: Account, b: Account): number {
  return compareText(a.username, b.username) || (a.username < b.username ? -1 : a.username > b.username ? 1 : 0);
}

/** Tri de la liste ; égalité départagée par l'identifiant. Ne mute pas l'entrée. */
export function sortAccounts(accounts: readonly Account[], sort: SortState): Account[] {
  return sortRows(
    accounts,
    sort,
    {
      identifiant: compareUsernames,
      joueur: comparePlayers,
      equipe: (a, b) => compareText(a.teamName, b.teamName),
    },
    compareUsernames,
  );
}
