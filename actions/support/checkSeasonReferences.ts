import "server-only";
import { unstable_rethrow } from "next/navigation";
import { findDuplicateSeason } from "@/models/findDuplicateSeason";
import type { SeasonInput } from "@/models/SeasonInput";
import { listAllSeasons } from "@/repositories/SeasonRepository";
import { listTeams } from "@/repositories/TeamRepository";

export type SeasonReferenceCheck = { kind: "ok" } | { kind: "teamGone" } | { kind: "duplicate" } | { kind: "unavailable" };

/**
 * Vérifications avant d'écrire une saison : l'équipe existe-t-elle ? une saison identique existe-t-elle déjà
 * (`excludeSeasonId` : la saison modifiée est ignorée) ? Fermé par défaut : si les équipes ou les saisons sont
 * illisibles, `unavailable` et l'appelant n'écrit pas. `redirect()` (session expirée) est relancé.
 */
export async function checkSeasonReferences(
  input: SeasonInput,
  token: string,
  options: { excludeSeasonId?: number } = {},
): Promise<SeasonReferenceCheck> {
  try {
    const [teams, seasons] = await Promise.all([listTeams(token), listAllSeasons(token)]);
    if (!teams.some((team) => team.id === input.teamId)) return { kind: "teamGone" };
    if (findDuplicateSeason(seasons, input, options.excludeSeasonId)) return { kind: "duplicate" };
    return { kind: "ok" };
  } catch (error) {
    unstable_rethrow(error);
    return { kind: "unavailable" };
  }
}
