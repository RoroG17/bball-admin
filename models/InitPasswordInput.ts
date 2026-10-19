import { z } from "zod";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "@/models/PasswordRule";

export type InitPasswordField = "password" | "confirmation";

/** Règle D4 : 8 caractères Unicode minimum, 72 octets UTF-8 maximum, différent de l'identifiant. Jamais de `trim`. */
export function createInitPasswordSchema(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  return z
    .object({
      password: z
        .string()
        .refine((value) => [...value].length >= PASSWORD_MIN_LENGTH, {
          message: "Le mot de passe doit contenir au moins 8 caractères.",
          abort: true,
        })
        .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, {
          message: "Le mot de passe est trop long (72 octets maximum).",
          abort: true,
        })
        .refine((value) => value.trim().toLowerCase() !== normalizedUsername, {
          message: "Le mot de passe ne doit pas être identique à l'identifiant.",
        }),
      confirmation: z.string().min(1, "Confirme le mot de passe."),
    })
    .refine((input) => input.confirmation === "" || input.confirmation === input.password, {
      message: "Les deux mots de passe ne sont pas identiques.",
      path: ["confirmation"],
    });
}

export type InitPasswordInput = z.infer<ReturnType<typeof createInitPasswordSchema>>;
