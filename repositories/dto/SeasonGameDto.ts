import { z } from "zod";
import { GameSchema } from "@/models/Game";
import { GameFieldsDto, toGame } from "@/repositories/dto/GameDto";
import { numeric } from "@/repositories/dto/numeric";

/** Un élément de `GET /api/matchs` : le match et sa saison (pour le filtrage, jamais exposée hors repository). */
export const SeasonGameDto = GameFieldsDto.extend({ idSaison: numeric }).transform((dto) => ({
  seasonId: dto.idSaison,
  game: GameSchema.parse(toGame(dto)),
}));

/** Strict : un tableau, rien d'autre. */
export const SeasonGameListDto = z.array(SeasonGameDto);
