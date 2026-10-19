import { z } from "zod";

/**
 * Réponse 200 de `POST /connect`. Un seul format (clé `token`, pas `access_token`, P9). Clés non lues : `message`,
 * `user.equipe`.
 */
export const ConnectSuccessDto = z.object({
  user: z.object({
    username: z.string().min(1),
    joueur: z.string().nullable(),
  }),
  token: z.string().min(1),
});
