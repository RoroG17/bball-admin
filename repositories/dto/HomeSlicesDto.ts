import { z } from "zod";
import { GameDto } from "@/repositories/dto/GameDto";
import { numeric } from "@/repositories/dto/numeric";
import { PlayerDto } from "@/repositories/dto/PlayerDto";
import { RankingEntryDto } from "@/repositories/dto/RankingEntryDto";

/*
 * `/accueil/{id}` est découpé en tranches : chaque repository ne valide que la sienne.
 * Une tranche mal formée fait échouer son bloc, pas toute la page.
 */

export const GamesSliceDto = z.object({
  previousGame: GameDto.nullable(),
  nextGame: GameDto.nullable(),
});

export const RecordSliceDto = z.object({
  ratioVictoire: numeric,
  ratioDefaite: numeric,
});

export const RosterSliceDto = z.object({
  joueurs: z.array(PlayerDto),
});

const rankingList = z.array(RankingEntryDto);

export const RankingsSliceDto = z.object({
  classPTSActuelle: rankingList,
  classPDActuelle: rankingList,
  classRebActuelle: rankingList,
  classIntActuelle: rankingList,
  classContreActuelle: rankingList,
  classBPActuelle: rankingList,
  classShootActuelle: rankingList,
  class3PtsActuelle: rankingList,
  classLFActuelle: rankingList,
});
