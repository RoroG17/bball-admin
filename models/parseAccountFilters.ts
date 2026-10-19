import { ACCOUNT_STATUS_FILTERS, type AccountStatusFilter } from "@/models/AccountListSpec";

/** Valeur hors liste : `null`. La vue redirige vers l'URL canonique si une valeur a été écartée. */
export function parseAccountFilters(filters: Readonly<Record<string, string>>): { status: AccountStatusFilter | null } {
  const status = filters.statut;
  return { status: ACCOUNT_STATUS_FILTERS.find((candidate) => candidate === status) ?? null };
}
