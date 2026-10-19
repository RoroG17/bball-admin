import { z } from "zod";
import { PeriodStatsSchema } from "@/models/PeriodStats";

/** Une ligne `jouer` vue depuis la fiche joueur : le match et sa saison à la place du joueur. */
export const PlayerStatLineSchema = z.object({
  /** `jouer.id` : identifiant de la LIGNE, jamais celui du match (P5). */
  lineId: z.number().int().positive(),
  /** `Id_Match`. */
  gameId: z.number().int().positive(),
  /** Saison du MATCH, même si le joueur n'y est pas inscrit (Q5). */
  seasonId: z.number().int().positive(),
  /** `match_libelle` « Dom - Ext », repli d'affichage. */
  gameLabel: z.string(),
  playingTimeSeconds: z.number().int().nonnegative().nullable(),
  periods: z.array(PeriodStatsSchema),
});

export type PlayerStatLine = z.infer<typeof PlayerStatLineSchema>;
