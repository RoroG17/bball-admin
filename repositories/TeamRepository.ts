import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/ApiError";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http";
import type { RpbTeamResolution } from "@/models/RpbTeamResolution";
import type { Team } from "@/models/Team";
import type { TeamInput } from "@/models/TeamInput";
import type { TeamsResolution } from "@/models/TeamsResolution";
import type { WriteResult } from "@/models/WriteFailure";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { TeamCreatedDto, TeamDetailDto, TeamDto, TeamListDto } from "@/repositories/dto/TeamDto";
import { readOrNull } from "@/repositories/support/readOrNull";
import { runWrite } from "@/repositories/support/runWrite";

/**
 * Nom de l'équipe RPB de la saison, pour savoir de quel côté elle joue.
 * Temporaire : à supprimer quand le back exposera les ids d'équipe sur les matchs.
 */
export const getTeamName = cache(async (teamId: number | null): Promise<string | null> => {
  if (teamId === null) return null;
  const session = await getCurrentSession();
  try {
    return TeamDto.parse(await apiGet(`/api/equipes/${teamId}`, { token: session?.token })).nom;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

/**
 * Équipe RPB de la saison, sous forme d'état typé : ne lève jamais d'exception, pour que l'échec
 * reste visible dans le seul bloc concerné. Argument primitif : `cache()` compare par identité.
 */
export const resolveRpbTeam = cache(async (teamId: number | null): Promise<RpbTeamResolution> => {
  if (teamId === null) return { kind: "notConfigured" };
  try {
    const name = await getTeamName(teamId);
    return name === null ? { kind: "notConfigured" } : { kind: "resolved", team: { id: teamId, name } };
  } catch (error) {
    // Laisse passer `redirect()` (session expirée, 401) : sinon il serait avalé ici.
    unstable_rethrow(error);
    return { kind: "unavailable" };
  }
});

/**
 * Toutes les équipes (`GET /api/equipes`), telles que reçues (le tri est fait par le modèle), une fois par requête.
 * Un élément invalide fait échouer la lecture : pas de tolérance. Lève si la lecture échoue (C2).
 */
export const listTeams = cache(async (token: string): Promise<Team[]> => {
  return TeamListDto.parse(await apiGet("/api/equipes", { token }));
});

/**
 * Une équipe pour l'administration. 404 → `null` ; format invalide ou autre erreur → lève (jamais de formulaire vide,
 * P5). Distinct de `getTeamName` (qui ne sert que l'accueil et le calendrier).
 */
export const getTeam = cache(async (id: number, token: string): Promise<Team | null> => {
  try {
    return TeamDetailDto.parse(await apiGet(`/api/equipes/${id}`, { token }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

/** Payload du back (R-ECR-3) : `logo` seulement s'il est renseigné (un `null` serait un faux effacement, B-T1). */
function buildTeamPayload(input: TeamInput): { nom: string; logo?: string } {
  return input.logo === null ? { nom: input.name } : { nom: input.name, logo: input.logo };
}

/** `POST /api/equipes`. Après un succès, un corps illisible donne `id: null` (l'écriture est faite, R-ECR-1). */
export async function createTeamRecord(input: TeamInput, token: string): Promise<WriteResult<{ id: number | null }>> {
  const result = await runWrite(() => apiPost("/api/equipes", buildTeamPayload(input), { token }));
  if (result.kind !== "ok") return result;
  const created = TeamCreatedDto.safeParse(result.value);
  return { kind: "ok", value: { id: created.success ? created.data.Id_Equipe : null } };
}

/** `PUT /api/equipes/{id}`. L'identifiant renvoyé est celui demandé (le corps n'est pas lu). */
export async function updateTeamRecord(id: number, input: TeamInput, token: string): Promise<WriteResult<{ id: number }>> {
  const result = await runWrite(() => apiPut(`/api/equipes/${id}`, buildTeamPayload(input), { token }));
  return result.kind === "ok" ? { kind: "ok", value: { id } } : result;
}

/** `DELETE /api/equipes/{id}` : un seul appel, la cascade est le rôle de la base (R4). */
export async function deleteTeamRecord(id: number, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiDelete(`/api/equipes/${id}`, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/**
 * Équipes pour la liste des saisons, sous forme d'état typé : ne lève jamais (sauf `redirect()` / `forbidden()` relancés),
 * `unavailable` si la lecture échoue — la liste reste utilisable avec « Équipe n° X » (D-S12). Enveloppe fine sur `listTeams`.
 */
export async function resolveTeams(token: string): Promise<TeamsResolution> {
  const teams = await readOrNull(() => listTeams(token));
  return teams === null ? { kind: "unavailable" } : { kind: "loaded", teams };
}
