import { z } from "zod";
import { PeriodStatsSchema } from "@/models/PeriodStats";
import { PlayerSchema } from "@/models/Player";

export const PlayerGameStatsSchema = z.object({
  /** Identifiant de la ligne de stats : un même joueur peut avoir plusieurs lignes (doublons). */
  lineId: z.number().int().positive(),
  /** Licence, nom, prénom et photo seulement : aucune donnée personnelle. */
  player: PlayerSchema,
  /** Temps de jeu sur tout le match, `null` si inconnu. */
  playingTimeSeconds: z.number().int().nonnegative().nullable(),
  /** Triées par `period`. */
  periods: z.array(PeriodStatsSchema),
});

export type PlayerGameStats = z.infer<typeof PlayerGameStatsSchema>;
