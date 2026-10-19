import { z } from "zod";
import { UserRoleSchema } from "@/models/Session";

/** Compte de connexion (`GET /api/users`). `role` est calculé par `resolveUserRole`, jamais lu du back (B3). */
export const AccountSchema = z.object({
  /** Valeur exacte du back : jamais rognée, jamais changée de casse. */
  username: z.string().min(1),
  /** Joueur rattaché (licence + identité). `null` : compte sans joueur. */
  player: z.object({ licence: z.string().min(1), firstName: z.string(), lastName: z.string() }).nullable(),
  /** Équipe du joueur rattaché (`null` : pas de joueur, ou joueur sans équipe). */
  teamName: z.string().nullable(),
  hasPassword: z.boolean(),
  role: UserRoleSchema,
});

export type Account = z.infer<typeof AccountSchema>;
export type AccountAnomaly = "unlinked" | "ambiguousUsername";
export type AccountProtection = "self" | "admin";
