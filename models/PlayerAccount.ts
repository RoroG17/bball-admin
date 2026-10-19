import { z } from "zod";

/** Compte de connexion lié à un joueur (`GET /api/users`). */
export const PlayerAccountSchema = z.object({ username: z.string().min(1), hasPassword: z.boolean() });

export type PlayerAccount = z.infer<typeof PlayerAccountSchema>;
