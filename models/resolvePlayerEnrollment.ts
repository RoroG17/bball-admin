import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import type { Season } from "@/models/Season";

export type PlayerEnrollment =
  | { kind: "noSeason" }
  | { kind: "enrolled"; season: Season }
  | { kind: "canEnroll"; season: Season };

/** « Saison en cours » = la plus récente (D-P2). Déjà inscrit (même en doublon dans `participer`) → `enrolled`. */
export function resolvePlayerEnrollment(
  seasons: readonly Season[],
  enrolledSeasonIds: readonly number[],
): PlayerEnrollment {
  const season = resolveSelectedSeason(seasons, undefined);
  if (season === null) return { kind: "noSeason" };
  return enrolledSeasonIds.includes(season.id) ? { kind: "enrolled", season } : { kind: "canEnroll", season };
}
