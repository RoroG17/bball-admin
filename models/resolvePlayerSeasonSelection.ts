import { CAREER_PARAM, type PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import type { Season } from "@/models/Season";

/** « carriere » → carrière ; sinon la saison demandée si elle est dans la liste, ou la plus récente ; aucune saison → carrière (P4). */
export function resolvePlayerSeasonSelection(
  seasons: readonly Season[],
  requested: string | undefined,
): PlayerSeasonSelection {
  if (requested === CAREER_PARAM) return { kind: "career" };
  const season = resolveSelectedSeason(seasons, requested);
  return season ? { kind: "season", season } : { kind: "career" };
}
