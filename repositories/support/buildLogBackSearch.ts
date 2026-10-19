import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { LOG_PAGE_SIZE, type LogListQuery } from "@/models/LogListQuery";
import type { LogStatusFilter } from "@/models/LogFilters";
import { buildLogPeriod } from "@/models/buildLogPeriod";
import { getActiveLogFilters } from "@/models/getActiveLogFilters";

/** Classe de statut → bornes (D-L8). Noms de paramètres `status_min` / `status_max` PROPOSÉS, à confirmer au back (B-LOG-2). */
const STATUS_BOUNDS: Record<LogStatusFilter, [number, number]> = {
  "2xx": [200, 299],
  "3xx": [300, 399],
  "4xx": [400, 499],
  "5xx": [500, 599],
};

/**
 * Requête V2 → chaîne de recherche du back (contrat BRUT, jamais dans un modèle). `per_page` vaut toujours 50 : la
 * taille ne vient jamais de l'URL de l'écran. Seuls les filtres ACTIFS pour ce type sont émis, même si l'objet en
 * contient d'autres (le back ignorerait un paramètre inconnu : la liste paraîtrait filtrée sans l'être).
 */
export function buildLogBackSearch(query: LogListQuery, support: LogBackSupportTable = LOG_BACK_SUPPORT): string {
  const params = new URLSearchParams();
  params.set("per_page", String(LOG_PAGE_SIZE));
  params.set("page", String(query.page));
  const active = getActiveLogFilters(query.kind, support);
  const { filters } = query;

  if (active.includes("plateforme") && filters.plateforme !== undefined) params.set("platform", filters.plateforme);
  if (active.includes("os") && filters.os !== undefined) params.set("os", filters.os);
  if (active.includes("source") && filters.source !== undefined) params.set("source", filters.source);
  if (active.includes("route") && filters.route !== undefined) params.set("route", filters.route);
  // Nom exact : paramètre `username` À CRÉER côté back (B-LOG-4). Jamais d'identifiant numérique (D-L4).
  if (active.includes("utilisateur") && filters.utilisateur !== undefined) params.set("username", filters.utilisateur);
  if (active.includes("statut") && filters.statut !== undefined) {
    const [min, max] = STATUS_BOUNDS[filters.statut];
    params.set("status_min", String(min));
    params.set("status_max", String(max));
  }
  const period = buildLogPeriod({
    du: active.includes("du") ? filters.du : undefined,
    au: active.includes("au") ? filters.au : undefined,
  });
  if (period.from !== null) params.set("from", period.from);
  if (period.to !== null) params.set("to", period.to);
  return params.toString();
}
