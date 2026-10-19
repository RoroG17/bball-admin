import type { AdminPlayer } from "@/models/AdminPlayer";
import { compareText } from "@/models/compareText";
import type { TeamOption } from "@/models/Team";

/** Équipes présentes dans la liste (sans doublon), triées par nom : les options du filtre « Équipe ». */
export function listPlayerTeams(rows: readonly AdminPlayer[]): TeamOption[] {
  const teams = new Map<number, TeamOption>();
  for (const { team } of rows) if (!teams.has(team.id)) teams.set(team.id, { id: team.id, name: team.name });
  return [...teams.values()].sort((a, b) => compareText(a.name, b.name) || a.id - b.id);
}
