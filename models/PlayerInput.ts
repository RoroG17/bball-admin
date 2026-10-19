import { z } from "zod";
import { ADMIN_PLAYER_MESSAGES as MESSAGES } from "@/models/adminPlayerMessages";
import { CIVILITIES } from "@/models/Civility";
import type { FormState } from "@/models/FormState";
import { isValidIsoDate } from "@/models/isValidIsoDate";
import { normalizePhotoFileName } from "@/models/normalizePhotoFileName";
import { normalizePlayerLicence } from "@/models/normalizePlayerLicence";

export const PLAYER_FIELDS = ["licence", "lastName", "firstName", "civility", "birthDate", "photo", "teamId"] as const;
export type PlayerField = (typeof PLAYER_FIELDS)[number];
export type PlayerFormState = FormState<PlayerField>;

export const PLAYER_BIRTH_DATE_MIN = "1930-01-01";
export const PLAYER_NAME_MAX_LENGTH = 255;
export const PLAYER_LICENCE_MAX_LENGTH = 8;

/**
 * Schéma unique du formulaire et des actions (création et modification). `today` = date du jour à Paris, passée par
 * l'appelant pour garder la fonction pure. Une seule erreur par champ ressort (`zodErrorToFormState`).
 */
export function createPlayerInputSchema(today: string) {
  return z.object({
    licence: z
      .string()
      .transform(normalizePlayerLicence)
      .pipe(
        z
          .string()
          .min(1, MESSAGES.licenceRequired)
          .regex(new RegExp(`^[A-Z0-9]{1,${PLAYER_LICENCE_MAX_LENGTH}}$`), MESSAGES.licenceInvalid),
      ),
    lastName: z.string().trim().min(1, MESSAGES.lastNameRequired).max(PLAYER_NAME_MAX_LENGTH, MESSAGES.lastNameTooLong),
    firstName: z
      .string()
      .trim()
      .min(1, MESSAGES.firstNameRequired)
      .max(PLAYER_NAME_MAX_LENGTH, MESSAGES.firstNameTooLong),
    civility: z.enum(CIVILITIES, { error: MESSAGES.civilityRequired }),
    birthDate: z
      .string()
      .trim()
      .superRefine((value, context) => {
        const problem = !isValidIsoDate(value)
          ? MESSAGES.birthDateInvalid
          : value > today
            ? MESSAGES.birthDateFuture
            : value < PLAYER_BIRTH_DATE_MIN
              ? MESSAGES.birthDateTooOld
              : null;
        if (problem) context.addIssue({ code: "custom", message: problem });
      }),
    photo: z.string().transform((raw, context): string | null => {
      const photo = normalizePhotoFileName(raw);
      if (photo.kind === "invalid") {
        context.addIssue({ code: "custom", message: MESSAGES.photoInvalid });
        return z.NEVER;
      }
      return photo.kind === "ok" ? photo.fileName : null;
    }),
    teamId: z
      .string()
      .trim()
      .regex(/^[1-9]\d{0,9}$/, MESSAGES.teamRequired)
      .transform(Number),
  });
}

/** `{ licence, lastName, firstName, civility, birthDate, photo (nom ou null), teamId }`, valeurs normalisées. */
export type PlayerInput = z.infer<ReturnType<typeof createPlayerInputSchema>>;
