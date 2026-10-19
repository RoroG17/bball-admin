import { z } from "zod";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { isValidIsoDate } from "@/models/isValidIsoDate";

export const GAME_ROUND_MAX = 999;
export const GAME_SIDES = ["home", "away"] as const;

const positiveId = (required: string, invalid: string) =>
  z
    .string()
    .trim()
    .min(1, required)
    .regex(/^[1-9]\d{0,8}$/, invalid)
    .transform(Number);

/**
 * Schéma UNIQUE du formulaire et des actions. Entrée : chaînes du `FormData` ; sortie : nombres. Jamais de `z.coerce`
 * (un champ vide ne devient jamais 0).
 */
export const GameFormSchema = z.object({
  seasonId: positiveId(GAME_MESSAGES.seasonRequired, GAME_MESSAGES.seasonInvalid),
  round: z
    .string()
    .trim()
    .min(1, GAME_MESSAGES.roundRequired)
    .regex(/^\d{1,3}$/, GAME_MESSAGES.roundInvalid)
    .transform(Number)
    .pipe(z.number().min(1, GAME_MESSAGES.roundInvalid).max(GAME_ROUND_MAX, GAME_MESSAGES.roundInvalid)),
  date: z.string().trim().min(1, GAME_MESSAGES.dateRequired).refine(isValidIsoDate, GAME_MESSAGES.dateInvalid),
  side: z.enum(GAME_SIDES, { error: GAME_MESSAGES.sideRequired }),
  opponentId: positiveId(GAME_MESSAGES.opponentRequired, GAME_MESSAGES.opponentInvalid),
});

/** Match hérité qui n'oppose pas le RPB de sa saison (D-G4) : le côté et l'adversaire ne sont pas demandés. */
export const GameFixedTeamsFormSchema = GameFormSchema.omit({ side: true, opponentId: true });

export type GameFormInput = z.infer<typeof GameFormSchema>;
export type GameFixedTeamsInput = z.infer<typeof GameFixedTeamsFormSchema>;
