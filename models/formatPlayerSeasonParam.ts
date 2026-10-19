import { CAREER_PARAM, type PlayerSeasonSelection } from "@/models/PlayerSeasonSelection";

/** Valeur canonique de `?saison=` sur la fiche. */
export function formatPlayerSeasonParam(selection: PlayerSeasonSelection): string {
  return selection.kind === "career" ? CAREER_PARAM : String(selection.season.id);
}
