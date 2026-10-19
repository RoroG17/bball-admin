export const LOG_KINDS = ["errors", "requests"] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const DEFAULT_LOG_KIND: LogKind = "errors";

export const LOG_KIND_LABELS: Record<LogKind, { tab: string; singular: string; plural: string }> = {
  errors: { tab: "Erreurs", singular: "erreur", plural: "erreurs" },
  requests: { tab: "Requêtes", singular: "requête", plural: "requêtes" },
};

/** Valeur de `?type=` dans l'URL. */
export const LOG_KIND_PARAMS: Record<LogKind, string> = { errors: "erreurs", requests: "requetes" };
