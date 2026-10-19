import { dedupeByLicence } from "@/models/dedupeByLicence";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

/** Nombre maximal de candidats affichés (D-S11). */
export const CANDIDATE_LIMIT = 30;

export type SeasonParticipantsSplit = {
  participants: PlayerListEntry[];
  candidates: PlayerListEntry[];
  /** Nombre de candidats avant troncature. */
  candidateTotal: number;
};

/**
 * Inscrits (jamais filtrés par la recherche) et candidats (non inscrits, filtrés par `query`, 30 au plus). Une licence
 * inscrite absente de `allPlayers` est ignorée. Entrées non mutées.
 */
export function splitSeasonParticipants(
  allPlayers: readonly PlayerListEntry[],
  enrolledLicences: ReadonlySet<string>,
  query: string,
): SeasonParticipantsSplit {
  const unique = dedupeByLicence(allPlayers);
  const participants = unique.filter((entry) => enrolledLicences.has(entry.player.licence));
  const matching = filterPlayersByName(
    unique.filter((entry) => !enrolledLicences.has(entry.player.licence)),
    query,
  );
  return { participants, candidates: matching.slice(0, CANDIDATE_LIMIT), candidateTotal: matching.length };
}
