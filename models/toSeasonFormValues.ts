import type { FormValues } from "@/models/FormState";
import { getDefaultSeasonYears } from "@/models/getDefaultSeasonYears";
import { resolveSeasonTeamValue } from "@/models/resolveSeasonTeamValue";
import type { Season } from "@/models/Season";
import type { SeasonField } from "@/models/SeasonInput";
import type { Team } from "@/models/Team";

/**
 * Valeurs initiales du formulaire. Création (`season` nul) : années de la saison sportive en cours (`isoDate` = jour de
 * Paris), champs texte vides, équipe non choisie. Modification : valeurs de la saison, équipe `""` si elle est inconnue.
 */
export function toSeasonFormValues(season: Season | null, teams: readonly Team[], isoDate: string): FormValues<SeasonField> {
  if (season === null) {
    const years = getDefaultSeasonYears(isoDate);
    return {
      startYear: String(years.startYear),
      endYear: String(years.endYear),
      championship: "",
      category: "",
      teamId: "",
    };
  }
  return {
    startYear: String(season.startYear),
    endYear: String(season.endYear),
    championship: season.championship,
    category: season.category,
    teamId: resolveSeasonTeamValue(season.teamId, teams),
  };
}
