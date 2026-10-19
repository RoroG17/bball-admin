import { z } from "zod";

/**
 * Nombre, ou chaîne numérique renvoyée par la base pour les AVG / ROUND (`"12.50"`).
 * Ne pas utiliser `z.coerce.number()` : il transforme `null` en `0`.
 */
export const numeric = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .transform(Number)
  .pipe(z.number().finite());
