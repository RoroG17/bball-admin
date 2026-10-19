import { z } from "zod";
import { numeric } from "@/repositories/dto/numeric";
import { PlayerDto } from "@/repositories/dto/PlayerDto";

/** Ligne de classement, avant attribution du rang. */
export const RankingEntryDto = z
  .object({
    licence: z.string(),
    nom: z.string(),
    prenom: z.string(),
    photo: z.string().nullable().optional(),
    valeur: numeric,
    total: numeric.nullable().optional(),
  })
  .transform((dto) => ({
    player: PlayerDto.parse(dto),
    value: dto.valeur,
    total: dto.total ?? null,
  }));
