import type { SortState } from "@/models/AdminListQuery";
import type { AdminPlayer } from "@/models/AdminPlayer";
import { compareText } from "@/models/compareText";
import { sortRows } from "@/models/sortRows";

const byName = (a: AdminPlayer, b: AdminPlayer) =>
  compareText(a.player.lastName, b.player.lastName) || compareText(a.player.firstName, b.player.firstName);

/** Tri de la liste ; ex æquo départagés par nom, prénom puis licence (toujours croissants). Ne mute pas l'entrée. */
export function sortAdminPlayers(rows: readonly AdminPlayer[], sort: SortState): AdminPlayer[] {
  return sortRows(
    rows,
    sort,
    {
      nom: byName,
      licence: (a, b) => compareText(a.player.licence, b.player.licence),
      equipe: (a, b) => compareText(a.team.name, b.team.name),
      naissance: (a, b) => compareText(a.personalInfo.birthDate, b.personalInfo.birthDate),
    },
    (a, b) => byName(a, b) || compareText(a.player.licence, b.player.licence),
  );
}
