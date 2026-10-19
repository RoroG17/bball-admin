import type { Account, AccountAnomaly } from "@/models/Account";
import { isReservedUsername } from "@/models/isReservedUsername";

/** `unlinked` puis `ambiguousUsername`. Le compte `admin` n'a aucune anomalie. */
export function getAccountAnomalies(account: Account): AccountAnomaly[] {
  if (account.role === "admin") return [];
  const anomalies: AccountAnomaly[] = [];
  if (account.player === null) anomalies.push("unlinked");
  if (isReservedUsername(account.username)) anomalies.push("ambiguousUsername");
  return anomalies;
}
