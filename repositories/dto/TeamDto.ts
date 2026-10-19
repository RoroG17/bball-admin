import { z } from "zod";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { TeamSchema } from "@/models/Team";
import { numeric } from "@/repositories/dto/numeric";

export const TeamDto = z.object({
  Id_Equipe: numeric,
  nom: z.string(),
  logo: z.string().nullable().optional(),
});

type TeamDtoOutput = z.infer<typeof TeamDto>;

/** `Id_Equipe → id`, `nom → name`, `logo → logoFile` (+ `logoUrl`, construite ici et nulle part ailleurs). */
export function toTeam(dto: TeamDtoOutput): z.input<typeof TeamSchema> {
  return {
    id: dto.Id_Equipe,
    name: dto.nom,
    logoFile: dto.logo?.trim() || null,
    logoUrl: buildMediaUrl("logo", dto.logo),
  };
}

/** Une équipe d'administration (`GET /api/equipes/{id}` et éléments de la liste). */
export const TeamDetailDto = TeamDto.transform(toTeam).pipe(TeamSchema);

/** `GET /api/equipes` : tableau nu, strict (un élément invalide fait échouer le bloc). Définition unique (C2). */
export const TeamListDto = z.array(TeamDetailDto);

/** Réponse de `POST /api/equipes` : seul l'identifiant sert (R-ECR-1). */
export const TeamCreatedDto = z.object({ Id_Equipe: numeric });
