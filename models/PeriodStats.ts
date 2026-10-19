import { z } from "zod";

/** Compteur d'une période ; `null` = non saisi (compté 0 dans les sommes). */
const count = z.number().int().nonnegative().nullable();

export const ShotCounterSchema = z.object({ made: count, missed: count });

export const PeriodStatsSchema = z.object({
  /** 1 à 4 = Q1 à Q4 ; 5 et plus = prolongations (pas encore en base). */
  period: z.number().int().positive(),
  assists: count,
  offensiveRebounds: count,
  defensiveRebounds: count,
  steals: count,
  blocks: count,
  turnovers: count,
  fouls: count,
  twoPoints: ShotCounterSchema,
  threePoints: ShotCounterSchema,
  freeThrows: ShotCounterSchema,
  /** Conservé, non affiché. */
  passes: z.object({ completed: count, missed: count }),
});

export type PeriodStats = z.infer<typeof PeriodStatsSchema>;

export const REGULATION_PERIODS = 4;
