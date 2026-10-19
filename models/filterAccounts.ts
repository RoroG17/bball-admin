import type { Account } from "@/models/Account";
import type { AccountStatusFilter } from "@/models/AccountListSpec";
import { getAccountAnomalies } from "@/models/getAccountAnomalies";
import { normalizeSearchText } from "@/models/normalizeSearchText";

type AccountCriteria = { q: string; status: AccountStatusFilter | null };

/** Recherche (identifiant, prénom, nom, équipe, sans accent) ET filtre de statut. Ordre conservé. */
export function filterAccounts(accounts: readonly Account[], criteria: AccountCriteria): Account[] {
  const query = normalizeSearchText(criteria.q);
  return accounts.filter((account) => {
    if (criteria.status === "sans-mot-de-passe" && account.hasPassword) return false;
    if (criteria.status === "non-rattache" && !getAccountAnomalies(account).includes("unlinked")) return false;
    if (query === "") return true;
    const haystack = [account.username, account.player?.firstName, account.player?.lastName, account.teamName]
      .filter(Boolean)
      .join(" ");
    return normalizeSearchText(haystack).includes(query);
  });
}
