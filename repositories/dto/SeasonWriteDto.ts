import { z } from "zod";
import type { SeasonInput } from "@/models/SeasonInput";
import { numeric } from "@/repositories/dto/numeric";

/** Corps de `POST` / `PUT /api/saisons` : seul endroit où les noms du back apparaissent (R-ECR-3). */
export function toSeasonPayload(input: SeasonInput): {
  annee_debut: number;
  annee_fin: number;
  championnat: string;
  categorie: string;
  equipe: number;
} {
  return {
    annee_debut: input.startYear,
    annee_fin: input.endYear,
    championnat: input.championship,
    categorie: input.category,
    equipe: input.teamId,
  };
}

/** Réponse de `POST /api/saisons` : seul l'identifiant sert (R-ECR-1). */
export const CreatedSeasonDto = z.object({ Id_Saison: numeric }).transform((dto) => dto.Id_Saison);

/** Corps de `POST` et de `DELETE /api/participer` (le couple est dans le corps, même pour le `DELETE`). */
export function toParticipantPayload(seasonId: number, licence: string): { Id_Saison: number; licence: string } {
  return { Id_Saison: seasonId, licence };
}
