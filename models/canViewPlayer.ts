import type { Session } from "@/models/Session";

/**
 * Accès à une fiche (Q3, D3) : admin et soi-même toujours ; un autre joueur seulement s'il partage au moins une saison
 * avec lui. Sinon la page répond « Ce joueur n'existe pas » (on ne révèle pas son existence).
 */
export function canViewPlayer(input: {
  viewer: Pick<Session, "role" | "licence">;
  targetLicence: string;
  sharedSeasonCount: number;
}): boolean {
  const { viewer, targetLicence, sharedSeasonCount } = input;
  if (viewer.role === "admin" || viewer.licence === targetLicence) return true;
  return sharedSeasonCount > 0;
}
