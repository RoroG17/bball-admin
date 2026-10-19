import { z } from "zod";
import { PlayerSchema } from "@/models/Player";
import { PlayerTeamSchema } from "@/models/PlayerListEntry";

export const PersonalInfoSchema = z.object({
  /** Texte libre du back (« M », « F »…). */
  civility: z.string(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const PlayerProfileSchema = z.object({
  player: PlayerSchema,
  team: PlayerTeamSchema,
  /** `null` si le lecteur n'y a pas droit : la donnée n'est alors même pas lue dans la réponse du back (P2). */
  personalInfo: PersonalInfoSchema.nullable(),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
