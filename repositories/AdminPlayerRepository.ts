import "server-only";
import { cache } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http";
import type { AdminPlayer } from "@/models/AdminPlayer";
import type { PlayerDeletionFigures } from "@/models/computePlayerDeletionImpact";
import type { PlayerAccount } from "@/models/PlayerAccount";
import { PlayerAccountSchema } from "@/models/PlayerAccount";
import type { PlayerInput } from "@/models/PlayerInput";
import type { Season } from "@/models/Season";
import type { WriteResult } from "@/models/WriteFailure";
import { AdminPlayersDto, AdminPlayerSliceDto } from "@/repositories/dto/AdminPlayerDto";
import { PlayerAccountsDto } from "@/repositories/dto/PlayerAccountDto";
import { countPlayerExams } from "@/repositories/ExamRepository";
import { getPhysicalRecord } from "@/repositories/PhysicalRepository";
import { countPlayerStatLines } from "@/repositories/PlayerStatsRepository";
import { listAllSeasons, listParticipationSeasonIds } from "@/repositories/SeasonRepository";
import { getCurrentSession } from "@/repositories/SessionRepository";
import { fetchPlayerDetailPayload } from "@/repositories/sources/playerDetailSource";
import { fetchUsersPayload } from "@/repositories/sources/usersSource";
import { readOrNull } from "@/repositories/support/readOrNull";
import { runWrite } from "@/repositories/support/runWrite";

/**
 * Tous les joueurs (`GET /api/joueurs`), non triés, une fois par requête. Une ligne invalide fait échouer la lecture :
 * jamais une liste partielle. Ne journalise jamais le payload (dates de naissance).
 */
export const listAdminPlayers = cache(async (): Promise<AdminPlayer[]> => {
  const session = await getCurrentSession();
  return AdminPlayersDto.parse(await apiGet("/api/joueurs", { token: session?.token }));
});

/**
 * Un joueur pour l'édition et la page de création (tranche `joueur` de `GET /api/joueurs/{licence}`, partagée avec la
 * fiche publique). 404 → `null` ; format invalide → lève (jamais de formulaire vide).
 */
export async function getAdminPlayer(licence: string): Promise<AdminPlayer | null> {
  const payload = await fetchPlayerDetailPayload(licence);
  return payload === null ? null : AdminPlayerSliceDto.parse(payload);
}

/**
 * Compte de connexion du joueur : première ligne de `GET /api/users` dont `joueur === licence`, sinon `null`. Format
 * invalide → lève (le bloc concerné affiche son erreur). L'identifiant est lu, jamais recalculé (D-P3).
 */
export const getPlayerAccount = cache(async (licence: string, token: string): Promise<PlayerAccount | null> => {
  const accounts = PlayerAccountsDto.parse(await fetchUsersPayload(token));
  const found = accounts.find((account) => account.licence === licence);
  return found ? PlayerAccountSchema.parse({ username: found.username, hasPassword: found.hasPassword }) : null;
});

/**
 * Les cinq chiffres de l'impact d'une suppression, en cinq lectures INDÉPENDANTES : une lecture en échec donne `null`
 * pour son chiffre seul (jamais 0, jamais de levée). `redirect()` (session expirée) est relancé par `readOrNull`.
 */
export async function getPlayerDeletionFigures(licence: string, token: string): Promise<PlayerDeletionFigures> {
  const [accountCount, seasonCount, statLineCount, examCount, measurementCount] = await Promise.all([
    readOrNull(async () => ((await getPlayerAccount(licence, token)) ? 1 : 0)),
    readOrNull(async () => (await listParticipationSeasonIds(licence, token)).length),
    readOrNull(() => countPlayerStatLines(licence)),
    readOrNull(() => countPlayerExams(licence)),
    readOrNull(async () => {
      const record = await getPhysicalRecord(licence);
      return record.measurements.length + record.unknownEntries.reduce((sum, entry) => sum + entry.count, 0);
    }),
  ]);
  return { accountCount, seasonCount, statLineCount, examCount, measurementCount };
}

/** Saisons existantes et saisons où le joueur est inscrit (deux lectures en parallèle) ; échec → lève. */
export async function getPlayerEnrollment(
  licence: string,
  token: string,
): Promise<{ seasons: Season[]; enrolledSeasonIds: number[] }> {
  const [seasons, enrolledSeasonIds] = await Promise.all([
    listAllSeasons(token),
    listParticipationSeasonIds(licence, token),
  ]);
  return { seasons, enrolledSeasonIds };
}

/** `POST /api/joueurs` : le back attend `equipe` (R-ECR-3). La licence rendue est celle soumise (réponse non lue). */
export async function createPlayerRecord(input: PlayerInput, token: string): Promise<WriteResult<{ licence: string }>> {
  const result = await runWrite(() =>
    apiPost(
      "/api/joueurs",
      {
        licence: input.licence,
        nom: input.lastName,
        prenom: input.firstName,
        civilite: input.civility,
        date_naissance: input.birthDate,
        equipe: input.teamId,
        photo: input.photo,
      },
      { token },
    ),
  );
  return result.kind === "ok" ? { kind: "ok", value: { licence: input.licence } } : result;
}

/** `PUT /api/joueurs/{licence}` : le back attend `Id_Equipe` ; la licence n'est pas dans le corps. État complet, photo comprise. */
export async function updatePlayerRecord(input: PlayerInput, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() =>
    apiPut(
      `/api/joueurs/${encodeURIComponent(input.licence)}`,
      {
        nom: input.lastName,
        prenom: input.firstName,
        civilite: input.civility,
        date_naissance: input.birthDate,
        photo: input.photo,
        Id_Equipe: input.teamId,
      },
      { token },
    ),
  );
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `DELETE /api/joueurs/{licence}` : un seul appel, la cascade est le rôle de la base (D-ADM-1). */
export async function deletePlayerRecord(licence: string, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiDelete(`/api/joueurs/${encodeURIComponent(licence)}`, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}

/** `POST /api/participer` : inscription à une saison (réponse non lue). Le back n'a pas de clé unique : l'appelant relit avant. */
export async function enrollPlayerInSeason(licence: string, seasonId: number, token: string): Promise<WriteResult<null>> {
  const result = await runWrite(() => apiPost("/api/participer", { Id_Saison: seasonId, licence }, { token }));
  return result.kind === "ok" ? { kind: "ok", value: null } : result;
}
