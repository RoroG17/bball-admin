import type { CalendarGame } from "@/models/CalendarGame";

/** `awaitingStats` : `null` = indéterminé (l'appel `review` a échoué). */
export type AdminGameRow = { entry: CalendarGame; awaitingStats: boolean | null };
