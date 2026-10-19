import { z } from "zod";
import type { FormState } from "@/models/FormState";
import { isValidLogoFileName } from "@/models/isValidLogoFileName";
import { TEAM_MESSAGES } from "@/models/teamMessages";

export const TEAM_FIELDS = ["name", "logo"] as const;
export type TeamField = (typeof TEAM_FIELDS)[number];
export type TeamFormState = FormState<TeamField>;

/** Schéma unique du formulaire et des actions. Les espaces autour du nom sont rognés comme le fait Laravel. */
export const TeamInputSchema = z.object({
  name: z.string().trim().min(1, TEAM_MESSAGES.nameRequired).max(255, TEAM_MESSAGES.nameTooLong),
  logo: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || value.length <= 255, TEAM_MESSAGES.logoTooLong)
    .refine((value) => value === null || value.length > 255 || isValidLogoFileName(value), TEAM_MESSAGES.logoInvalid),
});

/** `{ name: string; logo: string | null }`. */
export type TeamInput = z.infer<typeof TeamInputSchema>;
