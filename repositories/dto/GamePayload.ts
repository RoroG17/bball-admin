import type { GameUpdateInput, GameValues } from "@/models/GameWriteInput";

/** Corps de `POST /api/matchs` : ni score ni vidéo (le back les force à 0 / `null`). Seul endroit des noms du back (R-ECR-3). */
export function toCreateGamePayload(values: GameValues): {
  Id_Saison: number;
  numero: number;
  date_match: string;
  equipe_domicile: number;
  equipe_exterieur: number;
} {
  return {
    Id_Saison: values.seasonId,
    numero: values.round,
    date_match: values.date,
    equipe_domicile: values.homeTeamId,
    equipe_exterieur: values.awayTeamId,
  };
}

/** Corps complet de `PUT /api/matchs/{id}` : tous les champs sont `required` côté back, `video` est nullable. */
export function toUpdateGamePayload(input: GameUpdateInput): ReturnType<typeof toCreateGamePayload> & {
  score_domicile: number;
  score_exterieur: number;
  video: string | null;
} {
  return {
    ...toCreateGamePayload(input),
    score_domicile: input.scores.home,
    score_exterieur: input.scores.away,
    video: input.video,
  };
}
