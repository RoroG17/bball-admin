import "server-only";
import type { LogBackSupportTable } from "@/models/LogBackSupport";
import { resolveLogBackSupport } from "@/models/resolveLogBackSupport";

/** Lecture à l'exécution : le bundler remplace `process.env.NODE_ENV` par une constante, pas `process.env[name]`. */
const readEnv = (name: string): string | undefined => process.env[name];

/**
 * Capacités du back pour les journaux. `LOG_BACK_SUPPORT_OVERRIDE=all` (back livré simulé) n'est lu QUE si
 * `NODE_ENV=test` (valeur réelle de l'environnement du processus) : sans effet en développement et en production.
 */
export function getLogBackSupport(): LogBackSupportTable {
  return resolveLogBackSupport({ nodeEnv: readEnv("NODE_ENV"), override: readEnv("LOG_BACK_SUPPORT_OVERRIDE") });
}
