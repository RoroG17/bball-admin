import "server-only";
import { cache } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http";
import type { GameUpdateInput, GameValues } from "@/models/GameWriteInput";
import type { WriteResult } from "@/models/WriteFailure";
import { AwaitingStatsListDto } from "@/repositories/dto/AwaitingStatsDto";
import { CreatedGameDto } from "@/repositories/dto/CreatedGameDto";
import { toCreateGamePayload, toUpdateGamePayload } from "@/repositories/dto/GamePayload";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { readOrNull } from "@/repositories/support/readOrNull";
import { runWrite } from "@/repositories/support/runWrite";

/**
 * Identifiants des matchs joués sans aucune ligne de statistiques (`GET /api/matchs/review`), une fois par requête. Ne
 * lève jamais (hors redirection 401 relancée) : réseau, 5xx ou format invalide → `null`, la liste affiche « Non vérifié »
 * au lieu de tomber (D-G8).
 */
export const listGamesAwaitingStats = cache(async (): Promise<ReadonlySet<number> | null> => {
  const session = await getCurrentSession();
  return readOrNull(async () => {
    const entries = AwaitingStatsListDto.parse(await apiGet("/api/matchs/review", { token: session?.token }));
    return new Set(entries.map((entry) => entry.idMatch));
  });
});

/** `POST /api/matchs`. Après un succès, un corps illisible donne `id: null` (l'écriture est faite, R-ECR-1). */
export async function createGameRecord(values: GameValues, token: string): Promise<WriteResult<{ id: number | null }>> {
  const result = await runWrite(() => apiPost("/api/matchs", toCreateGamePayload(values), { token }));
  if (result.kind !== "ok") return result;
  const created = CreatedGameDto.safeParse(result.value);
  return { kind: "ok", value: { id: created.success ? created.data.Id_Match : null } };
}

/** `PUT /api/matchs/{id}` : corps complet, réponse ignorée (R-ECR-2). */
export async function updateGameRecord(id: number, input: GameUpdateInput, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiPut(`/api/matchs/${id}`, toUpdateGamePayload(input), { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `DELETE /api/matchs/{id}` : un seul appel, la cascade est le rôle de la base (D-ADM-1, B-ADM-1). */
export async function deleteGameRecord(id: number, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiDelete(`/api/matchs/${id}`, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}
