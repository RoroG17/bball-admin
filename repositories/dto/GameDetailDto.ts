import { z } from "zod";
import { GameDetailSchema } from "@/models/GameDetail";
import { parseGameVideo } from "@/models/parseGameVideo";
import { GameFieldsDto, toGame } from "@/repositories/dto/GameDto";
import { numeric } from "@/repositories/dto/numeric";

/** `match` de `GET /api/matchs/{id}` : champs du calendrier + identifiants d'équipes, saison et vidéo. */
export const GameDetailDto = GameFieldsDto.extend({
  idDom: numeric,
  idExt: numeric,
  Id_Saison: numeric,
  video: z.string().nullable(),
})
  .transform((dto): z.input<typeof GameDetailSchema> => {
    const base = toGame(dto);
    return {
      game: { ...base, home: { ...base.home, teamId: dto.idDom }, away: { ...base.away, teamId: dto.idExt } },
      seasonId: dto.Id_Saison,
      video: parseGameVideo(dto.video),
    };
  })
  .pipe(GameDetailSchema);

export const GameDetailSliceDto = z.object({ match: GameDetailDto });
