import { z } from "zod";
import { SeasonDto } from "@/repositories/dto/SeasonDto";

/** Tranche « saison » de `GET /api/saisons/{id}` : `{ saison, participer }` → la saison. Indépendante des participants. */
export const SeasonDetailSliceDto = z.object({ saison: SeasonDto }).transform((dto) => dto.saison);

/**
 * Tranche « participer » : `[{ licence }, …]` → licences. `participer` vient d'un `join` sans `DISTINCT` (doublons
 * possibles) : le repository les absorbe dans un `Set`. Liste blanche : seule la licence est lue.
 */
export const SeasonParticipantsSliceDto = z
  .object({ participer: z.array(z.object({ licence: z.string().min(1) })) })
  .transform((dto) => dto.participer.map((row) => row.licence));
