import { z } from "zod";
import { AUTH_MESSAGES } from "@/models/authMessages";

/**
 * Identifiant : `trim`, 1 à 255 caractères. Mot de passe : vide ou espaces seuls → `undefined` (première connexion,
 * D2) ; sinon conservé tel quel, sans `trim` ; 1000 caractères au plus (borne anti-abus).
 */
export const LoginInputSchema = z.object({
  username: z.string().trim().min(1, AUTH_MESSAGES.invalidInput).max(255, AUTH_MESSAGES.invalidInput),
  password: z
    .string()
    .max(1000)
    .transform((value) => (value.trim() === "" ? undefined : value)),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
