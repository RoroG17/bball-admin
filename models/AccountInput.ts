import { z } from "zod";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import type { FormState } from "@/models/FormState";
import { validateUsername } from "@/models/validateUsername";

/** `joueur` n'est PAS un champ visible : lu à part par l'action. */
export const ACCOUNT_FIELDS = ["username"] as const;
export type AccountField = (typeof ACCOUNT_FIELDS)[number];
export type AccountFormState = FormState<AccountField>;

/** Schéma unique du formulaire et de l'action. Aucun `trim` : un espace est refusé, jamais nettoyé en silence. */
export const AccountInputSchema = z.object({
  username: z.string().superRefine((value, ctx) => {
    const issue = validateUsername(value);
    if (issue !== null) ctx.addIssue({ code: "custom", message: ACCOUNT_MESSAGES.username[issue] });
  }),
});

export type CreateAccountInput = { username: string; licence: string | null };
