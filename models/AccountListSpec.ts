import type { AdminListSpec } from "@/models/AdminListQuery";

export const ACCOUNT_STATUS_FILTERS = ["sans-mot-de-passe", "non-rattache"] as const;
export type AccountStatusFilter = (typeof ACCOUNT_STATUS_FILTERS)[number];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatusFilter, string> = {
  "sans-mot-de-passe": "Mot de passe non défini",
  "non-rattache": "Sans joueur rattaché",
};
export const ACCOUNT_STATUS_PLACEHOLDER = "Tous les comptes";

export const ACCOUNT_LIST_SPEC: AdminListSpec = {
  sortable: ["identifiant", "joueur", "equipe"],
  defaultSort: { column: "joueur", direction: "asc" },
  filters: ["statut"],
};
