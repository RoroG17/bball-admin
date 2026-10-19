import { z } from "zod";
import type { HallOfFameCategoryKey } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";
import { numeric } from "@/repositories/dto/numeric";
import { PlayerDto } from "@/repositories/dto/PlayerDto";

/** Clé de chaque catégorie dans `rankings` (`GET /api/history`). */
export const HALL_OF_FAME_BACK_KEYS: Record<HallOfFameCategoryKey, string> = {
  points: "points",
  assists: "assists",
  rebounds: "rebounds",
  steals: "steals",
  blocks: "blocks",
  turnovers: "turnovers",
  fieldGoalPct: "field_goal_percentage",
  threePointPct: "three_point_percentage",
  freeThrowPct: "free_throw_percentage",
};

/** Clé de chaque mode dans une catégorie. */
export const HALL_OF_FAME_BACK_MODES: Record<HallOfFameMode, string> = {
  bestGame: "max_game",
  averagePerGame: "avg_game",
  bestSeason: "max_season",
  averagePerSeason: "avg_season",
  career: "career_total",
};

/**
 * Une ligne de classement. `valeur` est un nombre ou une chaîne numérique (`"12.50"`), ou `null` quand toutes les
 * lignes de stats du joueur sont vides. Négatif, non numérique, ou pourcentage au-delà de 100 : tranche invalide.
 */
function HallOfFameEntryDto(kind: "volume" | "percent") {
  const value = kind === "percent" ? z.number().min(0).max(100) : z.number().min(0);
  return z
    .object({
      licence: z.string().min(1),
      nom: z.string(),
      prenom: z.string(),
      photo: z.string().nullable().optional(),
      valeur: numeric.pipe(value).nullable(),
    })
    .transform((dto) => ({
      player: PlayerDto.parse({ licence: dto.licence, nom: dto.nom, prenom: dto.prenom, photo: dto.photo }),
      value: dto.valeur,
    }));
}

/** Les entrées sans valeur sont écartées : une valeur absente n'est jamais classée à 0. */
function HallOfFameListDto(kind: "volume" | "percent") {
  return z
    .array(HallOfFameEntryDto(kind))
    .transform((list) => list.flatMap((entry) => (entry.value === null ? [] : [{ player: entry.player, value: entry.value }])));
}

/** Les 5 modes d'une catégorie, tous obligatoires. */
export function HallOfFameStatDto(kind: "volume" | "percent") {
  const list = HallOfFameListDto(kind);
  return z.object({
    max_game: list,
    avg_game: list,
    max_season: list,
    avg_season: list,
    career_total: list,
  });
}

/** Enveloppe tolérante : chaque catégorie est validée séparément par le repository. */
export const HallOfFameEnvelopeDto = z.object({ rankings: z.record(z.string(), z.unknown()) });

/** Forme générale seulement : sert à savoir si au moins une liste contient un joueur. */
export const HallOfFameEmptinessDto = z.object({
  rankings: z.record(z.string(), z.record(z.string(), z.array(z.unknown()))),
});
