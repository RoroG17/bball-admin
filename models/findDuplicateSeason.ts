import { normalizeSearchText } from "@/models/normalizeSearchText";
import type { Season } from "@/models/Season";
import type { SeasonInput } from "@/models/SeasonInput";

/**
 * Doublon strict : mêmes années et même équipe, championnat et catégorie égaux sans tenir compte de la casse, des
 * accents ni des espaces multiples. `excludeSeasonId` : la saison modifiée est ignorée. Plus petit `id` si plusieurs.
 */
export function findDuplicateSeason(
  seasons: readonly Season[],
  input: SeasonInput,
  excludeSeasonId?: number,
): Season | null {
  const championship = normalizeSearchText(input.championship);
  const category = normalizeSearchText(input.category);
  const matches = seasons.filter(
    (season) =>
      season.id !== excludeSeasonId &&
      season.startYear === input.startYear &&
      season.endYear === input.endYear &&
      season.teamId === input.teamId &&
      normalizeSearchText(season.championship) === championship &&
      normalizeSearchText(season.category) === category,
  );
  return matches.toSorted((a, b) => a.id - b.id)[0] ?? null;
}
