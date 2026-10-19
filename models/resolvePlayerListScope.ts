import { ALL_PLAYERS_PARAM, type PlayerListScope } from "@/models/PlayerListScope";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import type { Season } from "@/models/Season";
import type { UserRole } from "@/models/Session";

/**
 * Périmètre de la liste (Q3, D2) : « tous » pour un admin qui le demande ; sinon la saison demandée si elle est
 * accessible, ou la plus récente. Un joueur qui demande « tous » retombe sur sa saison par défaut.
 * `null` si aucune saison n'est accessible.
 */
export function resolvePlayerListScope(
  seasons: readonly Season[],
  requested: string | undefined,
  role: UserRole,
): PlayerListScope | null {
  if (requested === ALL_PLAYERS_PARAM && role === "admin") return { kind: "all" };
  const season = resolveSelectedSeason(seasons, requested);
  return season ? { kind: "season", season } : null;
}
