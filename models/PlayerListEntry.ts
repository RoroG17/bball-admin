import { z } from "zod";
import { PlayerSchema } from "@/models/Player";

export const PlayerTeamSchema = z.object({
  /** `joueurs.Id_Equipe` : équipe ACTUELLE du joueur, pas celle de la saison affichée. */
  id: z.number().int().positive(),
  name: z.string(),
  logoUrl: z.url().nullable(),
});

/** Carte de la liste : identité et équipe, jamais de donnée personnelle (P2). */
export const PlayerListEntrySchema = z.object({ player: PlayerSchema, team: PlayerTeamSchema });

export type PlayerTeam = z.infer<typeof PlayerTeamSchema>;
export type PlayerListEntry = z.infer<typeof PlayerListEntrySchema>;
