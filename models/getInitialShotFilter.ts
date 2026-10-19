import type { ShotFilter } from "@/models/ShotFilter";
import type { ShotPlayerOption } from "@/models/ShotPlayerOption";

/** Pré-filtre sur le joueur connecté s'il a des tirs placés (« mes tirs », D8), sinon tous. */
export function getInitialShotFilter(currentLicence: string | null, options: readonly ShotPlayerOption[]): ShotFilter {
  const hasShots = currentLicence !== null && options.some((option) => option.licence === currentLicence);
  return { side: "team", playerLicence: hasShots ? currentLicence : null, period: null };
}
