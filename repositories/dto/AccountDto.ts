import { z } from "zod";
import type { Account } from "@/models/Account";
import { resolveUserRole } from "@/models/resolveUserRole";

/**
 * `has_password` : `CASE WHEN password IS NULL THEN 0 ELSE 1 END`. Entier selon le SGBD, parfois chaîne (D-U7, format réel
 * à capturer). Jamais `z.coerce` ni la vérité JS : `"0"` est faux (P9). Toute autre valeur fait échouer la lecture.
 */
const HasPasswordDto = z
  .union([z.literal(0), z.literal(1), z.literal("0"), z.literal("1")])
  .transform((value) => value === 1 || value === "1");

const AccountRowDto = z.object({
  username: z.string().min(1),
  joueur: z.string().nullable(),
  nom: z.string().nullable(),
  prenom: z.string().nullable(),
  equipe: z.string().nullable(),
  has_password: HasPasswordDto,
});

type AccountRow = z.infer<typeof AccountRowDto>;

function toAccount(row: AccountRow): Account {
  const licence = row.joueur?.trim() ?? "";
  return {
    username: row.username,
    player: licence === "" ? null : { licence, firstName: row.prenom ?? "", lastName: row.nom ?? "" },
    teamName: row.equipe,
    hasPassword: row.has_password,
    role: resolveUserRole({ username: row.username, licence: licence === "" ? null : licence }),
  };
}

/** `GET /api/users` : `{ users: [...] }`, strict (une ligne invalide fait échouer la lecture, jamais une liste partielle). */
export const AccountsDto = z.object({ users: z.array(AccountRowDto) }).transform((dto) => dto.users.map(toAccount));

/** `POST /api/users` : le `User` créé. Lu en `safeParse` par le repository (une réponse illisible ne fait pas échouer l'écriture). */
export const CreatedAccountDto = z.object({ username: z.string().min(1), joueur: z.string().nullable().optional() });
