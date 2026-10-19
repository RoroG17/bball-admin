export const LOG_SOURCES = ["server", "client"] as const;
export type LogSource = (typeof LOG_SOURCES)[number];

export const LOG_SOURCE_LABELS: Record<LogSource, { label: string; hint: string }> = {
  server: { label: "Serveur", hint: "Erreur HTTP renvoyée par l'API" },
  client: { label: "Client", hint: "Erreur remontée par une application" },
};
