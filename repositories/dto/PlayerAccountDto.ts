import { z } from "zod";
import { numeric } from "@/repositories/dto/numeric";

/**
 * Tranche de `GET /api/users` pour les comptes de joueurs (C5) : identifiant, licence liée et état du mot de passe.
 * `has_password` est un entier `0` / `1`, parfois une chaîne selon le pilote. Les autres clés sont ignorées.
 */
export const PlayerAccountsDto = z
  .object({
    users: z.array(z.object({ username: z.string(), joueur: z.string().nullable(), has_password: numeric })),
  })
  .transform((dto) =>
    dto.users.map((user) => ({ licence: user.joueur, username: user.username, hasPassword: user.has_password === 1 })),
  );
