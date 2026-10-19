import type { CalendarGame } from "@/models/CalendarGame";

export type SeasonCalendar = {
  /** Premier match à venir (date la plus proche), `null` en fin de saison. */
  next: CalendarGame | null;
  /** Autres matchs à venir, du plus proche au plus lointain (sans `next`). */
  upcoming: CalendarGame[];
  /** Matchs joués et matchs « score à saisir », du plus récent au plus ancien. */
  results: CalendarGame[];
};
