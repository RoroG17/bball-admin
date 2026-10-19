import type { LogKind } from "@/models/LogKind";
import type { LogSource } from "@/models/LogSource";

/** Ordre canonique des filtres dans l'URL. */
export const LOG_FILTER_KEYS = ["utilisateur", "plateforme", "os", "source", "route", "statut", "du", "au"] as const;
export type LogFilterKey = (typeof LOG_FILTER_KEYS)[number];

export type LogStatusFilter = "2xx" | "3xx" | "4xx" | "5xx";

export const LOG_PLATFORM_FILTERS = ["web", "mobile"] as const;
export type LogPlatformFilter = (typeof LOG_PLATFORM_FILTERS)[number];

export type LogFilters = {
  /** Nom d'utilisateur EXACT, ≤ 255. */
  utilisateur?: string;
  plateforme?: LogPlatformFilter;
  /** ≤ 50. */
  os?: string;
  /** Erreurs seulement. */
  source?: LogSource;
  /** ≤ 191 ; « contient ». */
  route?: string;
  statut?: LogStatusFilter;
  /** `YYYY-MM-DD`, jour de PARIS. */
  du?: string;
  /** `YYYY-MM-DD`, jour de PARIS, borne incluse. */
  au?: string;
};

export const LOG_FILTER_MAX_LENGTHS = { utilisateur: 255, os: 50, route: 191 } as const;

/** Filtres que l'écran sait proposer, par type de journal. */
export const LOG_TARGET_FILTERS: Record<LogKind, readonly LogFilterKey[]> = {
  errors: ["utilisateur", "plateforme", "os", "source", "route", "statut", "du", "au"],
  requests: ["utilisateur", "plateforme", "os", "route", "statut", "du", "au"],
};

export const LOG_STATUS_FILTER_OPTIONS: Record<LogKind, readonly LogStatusFilter[]> = {
  errors: ["4xx", "5xx"],
  requests: ["2xx", "3xx", "4xx", "5xx"],
};

export const LOG_STATUS_FILTER_LABELS: Record<LogStatusFilter, string> = {
  "2xx": "Succès (2xx)",
  "3xx": "Redirections (3xx)",
  "4xx": "Erreurs client (4xx)",
  "5xx": "Erreurs serveur (5xx)",
};
