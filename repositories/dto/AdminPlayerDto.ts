import { z } from "zod";
import { AdminPlayerSchema } from "@/models/AdminPlayer";
import { PlayerListEntryFields, toPlayerListEntry } from "@/repositories/dto/PlayerListDto";

/** Ligne de joueur pour l'administration : l'identité publique + civilité et date de naissance. `physics` est ignoré. */
const AdminPlayerFields = PlayerListEntryFields.extend({
  civilite: z.string(),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
});

type AdminPlayerFieldsOutput = z.infer<typeof AdminPlayerFields>;

/** `photo` brut → `photoFile` (jamais l'URL seule : le formulaire a besoin du nom). */
export function toAdminPlayer(dto: AdminPlayerFieldsOutput) {
  return {
    ...toPlayerListEntry(dto),
    personalInfo: { civility: dto.civilite, birthDate: dto.date_naissance.slice(0, 10) },
    photoFile: dto.photo?.trim() || null,
  };
}

const AdminPlayerRowDto = AdminPlayerFields.transform(toAdminPlayer).pipe(AdminPlayerSchema);

/** `GET /api/joueurs` : `{ joueurs: [...] }`, strict (une ligne invalide fait échouer la lecture). */
export const AdminPlayersDto = z.object({ joueurs: z.array(AdminPlayerRowDto) }).transform((dto) => dto.joueurs);

/** Tranche `joueur` de `GET /api/joueurs/{licence}` ; `stats` et `examens` ne sont pas lus. */
export const AdminPlayerSliceDto = z.object({ joueur: AdminPlayerRowDto }).transform((dto) => dto.joueur);
