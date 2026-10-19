import type { UserRole } from "@/models/Session";

/**
 * `accessAdmin` : seule permission de la zone `/admin/*` (D-ADM-2) ; `editStats` : saisie / modification de match ;
 * `managePlayerData` : examens, mesures, participations ; `viewAllSeasons` : toutes les saisons.
 */
export type Permission = "accessAdmin" | "editStats" | "managePlayerData" | "viewAllSeasons";

/** Ajouter un rôle (ex. « coach ») = une valeur d'enum dans `Session.ts` + une ligne ici. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: ["accessAdmin", "editStats", "managePlayerData", "viewAllSeasons"],
  player: [],
};
