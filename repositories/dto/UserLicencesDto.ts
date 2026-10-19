import { z } from "zod";

/**
 * Tranche de `GET /api/users` pour l'impact d'une suppression : la licence seule, en liste blanche (jamais `username`,
 * `has_password`, `nom`…). Les comptes sans joueur (dont `admin`) sont écartés, les licences dédoublonnées.
 */
export const UserLicencesDto = z
  .object({ users: z.array(z.object({ joueur: z.string().nullable() })) })
  .transform((dto) => [
    ...new Set(dto.users.flatMap((user) => (user.joueur === null || user.joueur === "" ? [] : [user.joueur]))),
  ]);
