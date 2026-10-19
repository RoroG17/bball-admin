import { z } from "zod";

export const TEAM_NAME_MAX_LENGTH = 255;

export const TeamSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  /** Nom de fichier brut (information d'administration, valeur du champ du formulaire). */
  logoFile: z.string().min(1).nullable(),
  /** Construite par le repository via `buildMediaUrl`, jamais ailleurs. */
  logoUrl: z.url().nullable(),
});

export type Team = z.infer<typeof TeamSchema>;

/** Une équipe proposée dans une liste déroulante : toujours dérivée de `Team`, jamais un type indépendant (C1). */
export type TeamOption = Pick<Team, "id" | "name">;
