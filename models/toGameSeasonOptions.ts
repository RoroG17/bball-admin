import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import type { GameSeasonOption } from "@/models/GameSeasonOption";
import type { Season } from "@/models/Season";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import type { TeamOption } from "@/models/Team";

/** Saisons de la plus récente à la plus ancienne, avec le nom de leur équipe RPB (`null` si elle n'existe pas dans la liste). */
export function toGameSeasonOptions(seasons: readonly Season[], teams: readonly TeamOption[]): GameSeasonOption[] {
  return sortSeasonsByRecency(seasons).map((season) => ({
    id: season.id,
    label: formatSeasonLabel(season),
    rpbTeamId: season.teamId,
    rpbTeamName: teams.find((team) => team.id === season.teamId)?.name ?? null,
  }));
}
