import { z } from "zod";

export const GameTeamSchema = z.object({
  /** Identifiant de l'équipe ; `null` tant que `GET /api/matchs` ne le renvoie pas (demande au back B2). */
  teamId: z.number().int().positive().nullable(),
  name: z.string(),
  logoUrl: z.url().nullable(),
  score: z.number().int().nonnegative(),
});

export type GameTeam = z.infer<typeof GameTeamSchema>;
