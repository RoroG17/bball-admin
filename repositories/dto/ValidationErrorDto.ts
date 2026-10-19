import { z } from "zod";

/** Réponse 422 de Laravel : un tableau de messages par champ. */
export const ValidationErrorDto = z.object({
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())),
});
