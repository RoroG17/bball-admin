import { z } from "zod";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { PlayerListEntrySchema } from "@/models/PlayerListEntry";
import { numeric } from "@/repositories/dto/numeric";

/**
 * Champs d'un joueur de `joueurs.*` + équipe, en LISTE BLANCHE : `z.object` retire civilité, date de naissance et
 * `physics` (P2). Exporté pour être étendu par le DTO du profil.
 */
export const PlayerListEntryFields = z.object({
  licence: z.string().min(1),
  nom: z.string(),
  prenom: z.string(),
  photo: z.string().nullable().optional(),
  Id_Equipe: numeric,
  equipe: z.string(),
  logo: z.string().nullable().optional(),
});

type PlayerListEntryFieldsOutput = z.infer<typeof PlayerListEntryFields>;

export function toPlayerListEntry(dto: PlayerListEntryFieldsOutput) {
  return {
    player: {
      licence: dto.licence,
      lastName: dto.nom,
      firstName: dto.prenom,
      photoUrl: buildMediaUrl("joueur", dto.photo),
    },
    team: { id: dto.Id_Equipe, name: dto.equipe, logoUrl: buildMediaUrl("logo", dto.logo) },
  };
}

export const PlayerListEntryDto = PlayerListEntryFields.transform(toPlayerListEntry).pipe(PlayerListEntrySchema);

/** `GET /api/saisons/{id}/joueurs` : tableau nu. */
export const SeasonPlayersDto = z.array(PlayerListEntryDto);

/** `GET /api/joueurs` : `{ joueurs: [...] }`. */
export const AllPlayersDto = z.object({ joueurs: z.array(PlayerListEntryDto) }).transform((dto) => dto.joueurs);
