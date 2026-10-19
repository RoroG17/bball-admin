import { z } from "zod";
import { PlayerSchema } from "@/models/Player";
import { PlayerTeamSchema } from "@/models/PlayerListEntry";
import { PersonalInfoSchema } from "@/models/PlayerProfile";

/** Joueur vu par l'administration : identité, équipe actuelle, données personnelles et nom de fichier brut de la photo. */
export const AdminPlayerSchema = z.object({
  player: PlayerSchema,
  team: PlayerTeamSchema,
  personalInfo: PersonalInfoSchema,
  /** Nom de fichier brut (valeur du champ du formulaire) ; `null` si absent ou vide. */
  photoFile: z.string().min(1).nullable(),
});

export type AdminPlayer = z.infer<typeof AdminPlayerSchema>;
