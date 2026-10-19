import { z } from "zod";
import { GameTeamSchema } from "@/models/GameTeam";

export const GameSchema = z.object({
  id: z.number().int().positive(),
  number: z.number().int(),
  /** Date seule, sans heure ni fuseau (`YYYY-MM-DD`). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  home: GameTeamSchema,
  away: GameTeamSchema,
});

export type Game = z.infer<typeof GameSchema>;
