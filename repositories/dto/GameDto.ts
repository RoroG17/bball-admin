import { z } from "zod";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { GameSchema } from "@/models/Game";
import { numeric } from "@/repositories/dto/numeric";

/** Champs bruts d'un match, communs à `/accueil` et `GET /api/matchs`. */
export const GameFieldsDto = z.object({
  idMatch: numeric,
  numero: numeric,
  dateMatch: z.string().min(10),
  equipeDom: z.string(),
  equipeExt: z.string(),
  scoreDom: numeric.nullable(),
  scoreExt: numeric.nullable(),
  logoDom: z.string().nullable().optional(),
  logoExt: z.string().nullable().optional(),
});

type GameFields = z.infer<typeof GameFieldsDto>;

/** B2 : remplacer `teamId: null` par `dto.idDom ?? null` / `dto.idExt ?? null` quand le back les renverra. */
export function toGame(dto: GameFields): z.input<typeof GameSchema> {
  return {
    id: dto.idMatch,
    number: dto.numero,
    date: dto.dateMatch.slice(0, 10),
    home: { teamId: null, name: dto.equipeDom, logoUrl: buildMediaUrl("logo", dto.logoDom), score: dto.scoreDom ?? 0 },
    away: { teamId: null, name: dto.equipeExt, logoUrl: buildMediaUrl("logo", dto.logoExt), score: dto.scoreExt ?? 0 },
  };
}

export const GameDto = GameFieldsDto.transform(toGame).pipe(GameSchema);
