/** Valeur recopiée de `logs:prune --days=7` ; non exposée par l'API (B-LOG-6). Une seule définition. */
export const LOG_RETENTION_DAYS = 7;

export function describeLogRetention(): string {
  return `Les journaux sont conservés ${LOG_RETENTION_DAYS} jours, puis supprimés automatiquement.`;
}
