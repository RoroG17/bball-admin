"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authorizeAdminAction } from "@/actions/support/authorizeAdminAction";
import { refreshAfterAdminWrite } from "@/actions/support/refreshAfterAdminWrite";
import { GAME_FAILURE_OPTIONS } from "@/models/adminGameFieldMap";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { buildAdminGameListHref } from "@/models/buildAdminGameListHref";
import { classifyGameNotFound } from "@/models/classifyGameNotFound";
import { filterUnacknowledgedWarnings } from "@/models/filterUnacknowledgedWarnings";
import { formError, type ConfirmFormState, type FormValues } from "@/models/FormState";
import type { Game } from "@/models/Game";
import type { GameDetail } from "@/models/GameDetail";
import { GAME_FIELDS, type GameFormField, type GameFormState } from "@/models/GameFormField";
import { GameFixedTeamsFormSchema, GameFormSchema } from "@/models/GameInput";
import type { GameScores, GameUpdateInput, GameValues } from "@/models/GameWriteInput";
import { getGameFormWarnings } from "@/models/getGameFormWarnings";
import { getRpbSideById } from "@/models/getRpbSideById";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import { parseGameId } from "@/models/parseGameId";
import { parseGameScores } from "@/models/parseGameScores";
import { parseSeasonId } from "@/models/parseSeasonId";
import { parseVideoInput } from "@/models/parseVideoInput";
import { readFormValues } from "@/models/readFormValues";
import type { Season } from "@/models/Season";
import { resolveGameTeams } from "@/models/resolveGameTeams";
import { toVideoPayloadValue } from "@/models/toVideoPayloadValue";
import { toWarningState } from "@/models/toWarningState";
import type { WriteFailure } from "@/models/WriteFailure";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";
import { createGameRecord, deleteGameRecord, updateGameRecord } from "@/repositories/AdminGameRepository";
import { listSeasonGames, getGameDetail } from "@/repositories/GameRepository";
import { countGameStatLines } from "@/repositories/GameStatsRepository";
import { listAllSeasons } from "@/repositories/SeasonRepository";

const readHiddenValue = (formData: FormData, name: string): string => {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw : "";
};

/** Un 404 d'écriture est ambigu (match, équipe ou saison) : il est classé pour s'afficher sous le bon champ. */
function toWriteFailureState(failure: WriteFailure, values: FormValues<GameFormField>): GameFormState {
  if (failure.kind === "notFound") {
    const kind = classifyGameNotFound(failure.backMessage);
    if (kind === "team") return formError(values, ADMIN_MESSAGES.fixFields, { opponentId: GAME_MESSAGES.teamGone });
    if (kind === "season") return formError(values, ADMIN_MESSAGES.fixFields, { seasonId: GAME_MESSAGES.seasonGone });
  }
  return mapWriteFailure(failure, values, GAME_FAILURE_OPTIONS);
}

type SeasonGamesRead = { kind: "ok"; games: readonly Game[] } | { kind: "unavailable" };

/** Matchs de la saison cible (contrôle du doublon de journée). Fermé par défaut : illisible = aucune écriture. */
async function readSeasonGames(seasonId: number): Promise<SeasonGamesRead> {
  try {
    return { kind: "ok", games: await listSeasonGames(seasonId) };
  } catch (error) {
    unstable_rethrow(error);
    return { kind: "unavailable" };
  }
}

type SeasonsRead = { kind: "ok"; seasons: readonly Season[] } | { kind: "unavailable" };

async function readSeasons(token: string): Promise<SeasonsRead> {
  try {
    return { kind: "ok", seasons: await listAllSeasons(token) };
  } catch (error) {
    unstable_rethrow(error);
    return { kind: "unavailable" };
  }
}

type CurrentGameRead =
  | { kind: "ok"; detail: GameDetail; statLineCount: number | null }
  | { kind: "gone" }
  | { kind: "unavailable" };

async function readCurrentGame(gameId: number): Promise<CurrentGameRead> {
  try {
    const detail = await getGameDetail(gameId);
    if (detail === null) return { kind: "gone" };
    return { kind: "ok", detail, statLineCount: await countGameStatLines(gameId) };
  } catch (error) {
    unstable_rethrow(error);
    return { kind: "unavailable" };
  }
}

/** Création : garde, Zod, contrôles (saison, équipe RPB, doublon, date), avertissements acquittés, écriture, redirection. */
export async function createGame(_previous: GameFormState, formData: FormData): Promise<GameFormState> {
  const values = readFormValues(formData, GAME_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const parsed = GameFormSchema.safeParse(values);
  if (!parsed.success) return zodErrorToFormState(parsed.error, GAME_FIELDS, values);
  const input = parsed.data;

  const seasonsRead = await readSeasons(access.session.token);
  if (seasonsRead.kind === "unavailable") return formError(values, GAME_MESSAGES.verifyFailed);
  const season = seasonsRead.seasons.find((candidate) => candidate.id === input.seasonId);
  if (!season) return formError(values, ADMIN_MESSAGES.fixFields, { seasonId: GAME_MESSAGES.seasonGone });

  const teams = resolveGameTeams(input, season.teamId);
  if (!teams.ok) return formError(values, ADMIN_MESSAGES.fixFields, { [teams.field]: teams.message });

  const gamesRead = await readSeasonGames(season.id);
  if (gamesRead.kind === "unavailable") return formError(values, GAME_MESSAGES.verifyFailed);

  const gameValues: GameValues = {
    seasonId: season.id,
    round: input.round,
    date: input.date,
    homeTeamId: teams.homeTeamId,
    awayTeamId: teams.awayTeamId,
  };
  const warnings = filterUnacknowledgedWarnings(
    getGameFormWarnings({
      values: gameValues,
      scores: { home: 0, away: 0 },
      season,
      seasonGames: gamesRead.games,
      current: null,
    }),
    values,
  );
  if (warnings.length > 0) return toWarningState(values, warnings);

  const result = await createGameRecord(gameValues, access.session.token);
  if (result.kind !== "ok") return toWriteFailureState(result, values);

  refreshAfterAdminWrite("game", "create");
  redirect(buildAdminGameListHref(season.id, undefined, { code: "created", ref: result.value.id }));
}

/**
 * Modification : lectures de contrôle AVANT la validation (le schéma dépend du match courant), puis erreurs de champ
 * (toutes d'un coup), puis avertissements acquittés, puis écriture. Les erreurs de champ passent avant les avertissements.
 */
export async function updateGame(_previous: GameFormState, formData: FormData): Promise<GameFormState> {
  const values = readFormValues(formData, GAME_FIELDS);
  const access = await authorizeAdminAction();
  if (!access.ok) return formError(values, access.message);

  const gameId = parseGameId(readHiddenValue(formData, "gameId"));
  if (gameId === null) return formError(values, ADMIN_MESSAGES.gone);
  const { token } = access.session;

  const currentRead = await readCurrentGame(gameId);
  if (currentRead.kind === "gone") {
    refreshAfterAdminWrite("game", "update");
    return formError(values, ADMIN_MESSAGES.gone);
  }
  if (currentRead.kind === "unavailable") return formError(values, GAME_MESSAGES.verifyFailed);
  const { detail: current, statLineCount } = currentRead;

  const seasonsRead = await readSeasons(token);
  if (seasonsRead.kind === "unavailable") return formError(values, GAME_MESSAGES.verifyFailed);
  const currentSeason = seasonsRead.seasons.find((candidate) => candidate.id === current.seasonId);
  if (!currentSeason) return formError(values, GAME_MESSAGES.verifyFailed);

  // Match hérité sans l'équipe RPB de sa saison : équipes inchangées, côté et adversaire non demandés (D-G4).
  const legacy = getRpbSideById(current.game, currentSeason.teamId) === null;
  const full = legacy ? null : GameFormSchema.safeParse(values);
  const parsed = full ?? GameFixedTeamsFormSchema.safeParse(values);
  const fieldErrors: Partial<Record<GameFormField, string>> = parsed.success
    ? {}
    : zodErrorToFormState(parsed.error, GAME_FIELDS, values).fieldErrors;

  const scores = parseGameScores(values.homeScore, values.awayScore);
  if (scores.kind === "invalid") Object.assign(fieldErrors, scores.errors);

  const video = parseVideoInput(values.video, current.video);
  if (video.kind === "invalid") fieldErrors.video = GAME_MESSAGES.videoInvalid;
  if (video.kind === "removalUnsupported") fieldErrors.video = GAME_MESSAGES.videoRemovalUnsupported;

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return formError(values, ADMIN_MESSAGES.fixFields, fieldErrors);
  }
  if (scores.kind !== "score") return formError(values, ADMIN_MESSAGES.fixFields, fieldErrors);

  const targetSeason = seasonsRead.seasons.find((candidate) => candidate.id === parsed.data.seasonId);
  if (!targetSeason) return formError(values, ADMIN_MESSAGES.fixFields, { seasonId: GAME_MESSAGES.seasonGone });

  let homeTeamId: number;
  let awayTeamId: number;
  if (full?.success) {
    const teams = resolveGameTeams(full.data, targetSeason.teamId);
    if (!teams.ok) return formError(values, ADMIN_MESSAGES.fixFields, { [teams.field]: teams.message });
    ({ homeTeamId, awayTeamId } = teams);
  } else {
    if (current.game.home.teamId === null || current.game.away.teamId === null) {
      return formError(values, GAME_MESSAGES.verifyFailed);
    }
    homeTeamId = current.game.home.teamId;
    awayTeamId = current.game.away.teamId;
  }

  const gamesRead = await readSeasonGames(targetSeason.id);
  if (gamesRead.kind === "unavailable") return formError(values, GAME_MESSAGES.verifyFailed);

  const gameValues: GameValues = {
    seasonId: targetSeason.id,
    round: parsed.data.round,
    date: parsed.data.date,
    homeTeamId,
    awayTeamId,
  };
  const gameScores: GameScores = { home: scores.home, away: scores.away };
  const warnings = filterUnacknowledgedWarnings(
    getGameFormWarnings({
      values: gameValues,
      scores: gameScores,
      season: targetSeason,
      seasonGames: gamesRead.games,
      current: { game: current.game, seasonId: current.seasonId, statLineCount },
    }),
    values,
  );
  if (warnings.length > 0) return toWarningState(values, warnings);

  const update: GameUpdateInput = { ...gameValues, scores: gameScores, video: toVideoPayloadValue(video, current.video) };
  const result = await updateGameRecord(gameId, update, token);
  // Match disparu (ou 404 inclassable) : la ligne fantôme doit disparaître des pages déjà visitées.
  if (result.kind === "notFound" && ["game", "unknown"].includes(classifyGameNotFound(result.backMessage))) {
    refreshAfterAdminWrite("game", "update");
  }
  if (result.kind !== "ok") return toWriteFailureState(result, values);

  refreshAfterAdminWrite("game", "update");
  redirect(buildAdminGameListHref(targetSeason.id, undefined, { code: "updated", ref: gameId }));
}

/** Suppression : un seul DELETE, jamais de blocage applicatif (D-ADM-1) ; l'impact n'est pas recalculé ici. */
export async function deleteGame(_previous: ConfirmFormState, formData: FormData): Promise<ConfirmFormState> {
  const access = await authorizeAdminAction();
  if (!access.ok) return formError({}, access.message);

  const gameId = parseGameId(readHiddenValue(formData, "gameId"));
  if (gameId === null) return formError({}, ADMIN_MESSAGES.gone);
  // La saison ne sert qu'à la redirection : invalide, elle est ignorée.
  const seasonId = parseSeasonId(readHiddenValue(formData, "seasonId"));

  const result = await deleteGameRecord(gameId, access.session.token);
  if (result.kind === "ok") {
    refreshAfterAdminWrite("game", "delete");
    redirect(buildAdminGameListHref(seasonId, undefined, { code: "deleted" }));
  }
  if (result.kind === "notFound") {
    refreshAfterAdminWrite("game", "delete");
    return formError({}, ADMIN_MESSAGES.gone);
  }
  if (result.kind === "failed") return formError({}, ADMIN_MESSAGES.deleteFailed);
  return mapWriteFailure(result, {}, { fieldMap: {} });
}
