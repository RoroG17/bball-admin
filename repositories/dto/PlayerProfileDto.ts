import { z } from "zod";
import { PlayerProfileSchema, type PlayerProfile } from "@/models/PlayerProfile";
import { PlayerListEntryFields, toPlayerListEntry } from "@/repositories/dto/PlayerListDto";

/** Tranche `joueur` sans données personnelles : le schéma ne connaît même pas leurs clés (P2). `physics` jamais lu. */
export const PlayerProfileSliceDto = z
  .object({ joueur: PlayerListEntryFields })
  .transform(({ joueur }): PlayerProfile => ({ ...toPlayerListEntry(joueur), personalInfo: null }))
  .pipe(PlayerProfileSchema);

/** Tranche `joueur` avec civilité et date de naissance : seulement si le lecteur y a droit (admin, soi-même). */
export const PlayerProfileWithPersonalSliceDto = z
  .object({
    joueur: PlayerListEntryFields.extend({
      civilite: z.string(),
      date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
    }),
  })
  .transform(
    ({ joueur }): PlayerProfile => ({
      ...toPlayerListEntry(joueur),
      personalInfo: { civility: joueur.civilite, birthDate: joueur.date_naissance.slice(0, 10) },
    }),
  )
  .pipe(PlayerProfileSchema);
