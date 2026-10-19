import type { LogFilters } from "@/models/LogFilters";
import { getParisDayEndUtc } from "@/models/getParisDayEndUtc";
import { getParisDayStartUtc } from "@/models/getParisDayStartUtc";

/** Période saisie en jours de Paris → bornes `from` / `to` en UTC, fin incluse ; absente = `null`. */
export function buildLogPeriod(filters: Pick<LogFilters, "du" | "au">): { from: string | null; to: string | null } {
  return {
    from: filters.du === undefined ? null : getParisDayStartUtc(filters.du),
    to: filters.au === undefined ? null : getParisDayEndUtc(filters.au),
  };
}
