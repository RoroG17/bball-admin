import type { Account } from "@/models/Account";

/** Égalité stricte (jamais de casse ni de `trim`). Doublon : le premier, comme `connect` et `destroy` du back. */
export function findAccountByUsername(accounts: readonly Account[], username: string): Account | null {
  return accounts.find((account) => account.username === username) ?? null;
}
