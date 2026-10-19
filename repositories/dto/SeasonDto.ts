import { z } from "zod";
import { SeasonSchema } from "@/models/Season";
import { numeric } from "@/repositories/dto/numeric";

export const SeasonDto = z
  .object({
    Id_Saison: numeric,
    annee_debut: numeric,
    annee_fin: numeric,
    championnat: z.string().nullable(),
    categorie: z.string().nullable(),
    equipe: numeric.nullable(),
  })
  .transform((dto) => ({
    id: dto.Id_Saison,
    startYear: dto.annee_debut,
    endYear: dto.annee_fin,
    championship: dto.championnat ?? "",
    category: dto.categorie ?? "",
    teamId: dto.equipe,
  }))
  .pipe(SeasonSchema);

/** `/api/saisons` et `/saisons/{licence}` renvoient un tableau, et rien d'autre. */
export const SeasonListDto = z.array(SeasonDto);
