import { z } from "zod";

/**
 * Repère normalisé (D6) : `x` ∈ [0, 1] de la ligne de touche gauche (0) à la droite (1) ;
 * `y` ∈ [0, 1] de la ligne de fond côté panier (0) à la ligne médiane (1). Panier ≈ (0.5, 0.103).
 */
export const ShotPositionSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

export const ShotSchema = z.object({
  /** `${lineId}:${id brut}` : unique même si les identifiants bruts se répètent. */
  id: z.string().min(1),
  playerLicence: z.string().min(1),
  period: z.number().int().positive(),
  made: z.boolean(),
  position: ShotPositionSchema,
});

export type Shot = z.infer<typeof ShotSchema>;
export type ShotPosition = z.infer<typeof ShotPositionSchema>;
