import { z } from "zod";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { PlayerSchema } from "@/models/Player";

/** Les autres colonnes de `joueurs.*` (date de naissance, données physiques…) sont ignorées. */
export const PlayerDto = z
  .object({
    licence: z.string(),
    nom: z.string(),
    prenom: z.string(),
    photo: z.string().nullable().optional(),
  })
  .transform((dto) => ({
    licence: dto.licence,
    lastName: dto.nom,
    firstName: dto.prenom,
    photoUrl: buildMediaUrl("joueur", dto.photo),
  }))
  .pipe(PlayerSchema);
