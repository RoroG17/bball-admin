import "server-only";
import { cache } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http";
import { hasPermission } from "@/models/hasPermission";
import type { Season } from "@/models/Season";
import type { SeasonInput } from "@/models/SeasonInput";
import type { Session } from "@/models/Session";
import type { WriteResult } from "@/models/WriteFailure";
import { SeasonListDto } from "@/repositories/dto/SeasonDto";
import { SeasonDetailSliceDto, SeasonParticipantsSliceDto } from "@/repositories/dto/SeasonDetailDto";
import { CreatedSeasonDto, toParticipantPayload, toSeasonPayload } from "@/repositories/dto/SeasonWriteDto";
import { fetchSeasonDetailPayload } from "@/repositories/sources/seasonDetailSource";
import { runWrite } from "@/repositories/support/runWrite";

/**
 * Toutes les saisons (`GET /api/saisons`), une fois par requête (même jeton → même entrée du cache). Sert aussi aux
 * libellés des saisons de stats hors participation (Q5) ; jamais proposé tel quel à un joueur.
 */
export const listAllSeasons = cache(async (token: string): Promise<Season[]> => {
  return SeasonListDto.parse(await apiGet("/api/saisons", { token }));
});

/**
 * Saisons visibles par l'utilisateur : toutes pour un admin, les siennes pour un joueur, aucune pour un compte sans
 * joueur (D7, fermé par défaut).
 */
export async function listAccessibleSeasons(session: Session): Promise<Season[]> {
  if (hasPermission(session, "viewAllSeasons")) return listAllSeasons(session.token);
  if (session.licence === null) return [];
  return SeasonListDto.parse(
    await apiGet(`/saisons/${encodeURIComponent(session.licence)}`, { token: session.token }),
  );
}

/** Identifiants des saisons où le joueur CONSULTÉ est inscrit, sans doublon. `[]` si licence inconnue. */
export const listParticipationSeasonIds = cache(async (licence: string, token: string): Promise<number[]> => {
  const seasons = SeasonListDto.parse(await apiGet(`/saisons/${encodeURIComponent(licence)}`, { token }));
  return [...new Set(seasons.map((season) => season.id))];
});

/**
 * Une saison pour l'administration (tranche « saison » de `GET /api/saisons/{id}`). 404 → `null` ; format invalide ou
 * autre erreur → lève (jamais de formulaire sur des données illisibles, P10).
 */
export async function getSeasonById(seasonId: number, token: string): Promise<Season | null> {
  const payload = await fetchSeasonDetailPayload(seasonId, token);
  return payload === null ? null : SeasonDetailSliceDto.parse(payload);
}

/**
 * Licences inscrites à la saison (tranche « participer » de la même lecture), doublons du `join` absorbés. `null` si
 * la saison n'existe pas (404). Format invalide → lève.
 */
export async function listSeasonParticipantLicences(
  seasonId: number,
  token: string,
): Promise<ReadonlySet<string> | null> {
  const payload = await fetchSeasonDetailPayload(seasonId, token);
  return payload === null ? null : new Set(SeasonParticipantsSliceDto.parse(payload));
}

/** `POST /api/saisons`. Après un succès, un corps illisible donne `seasonId: null` (l'écriture est faite, R-ECR-1). */
export async function createSeasonRecord(
  input: SeasonInput,
  token: string,
): Promise<WriteResult<{ seasonId: number | null }>> {
  const result = await runWrite(() => apiPost("/api/saisons", toSeasonPayload(input), { token }));
  if (result.kind !== "ok") return result;
  const created = CreatedSeasonDto.safeParse(result.value);
  return { kind: "ok", value: { seasonId: created.success ? created.data : null } };
}

/** `PUT /api/saisons/{id}` : corps complet (5 champs). 404 = saison disparue. La réponse n'est pas lue. */
export async function updateSeasonRecord(seasonId: number, input: SeasonInput, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiPut(`/api/saisons/${seasonId}`, toSeasonPayload(input), { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `DELETE /api/saisons/{id}` : un seul appel, la cascade est le rôle de la base (D-ADM-1). */
export async function deleteSeasonRecord(seasonId: number, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiDelete(`/api/saisons/${seasonId}`, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `POST /api/participer`. Pas idempotent seul (aucune clé unique côté back) : l'action relit avant d'écrire. */
export async function addSeasonParticipantRecord(
  seasonId: number,
  licence: string,
  token: string,
): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiPost("/api/participer", toParticipantPayload(seasonId, licence), { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `DELETE /api/participer`, couple dans le corps JSON. Naturellement idempotent : 200 même si rien à supprimer. */
export async function removeSeasonParticipantRecord(
  seasonId: number,
  licence: string,
  token: string,
): Promise<WriteResult<null>> {
  const result = await runWrite(() =>
    apiDelete("/api/participer", { token, body: toParticipantPayload(seasonId, licence) }),
  );
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}
