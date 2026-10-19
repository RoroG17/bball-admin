import { compareText } from "@/models/compareText";
import type { TeamOption } from "@/models/Team";

/** Options d'une liste déroulante d'équipes, triées par nom (accents et casse ignorés) puis identifiant. */
export function toTeamSelectOptions(teams: readonly TeamOption[]): { value: string; label: string }[] {
  return [...teams]
    .sort((a, b) => compareText(a.name, b.name) || a.id - b.id)
    .map((team) => ({ value: String(team.id), label: team.name }));
}
