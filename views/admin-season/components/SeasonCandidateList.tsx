import Link from "next/link";
import { buildAdminHref } from "@/models/buildAdminHref";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { SeasonParticipantRow } from "@/views/admin-season/components/SeasonParticipantRow";

type SeasonCandidateListProps = {
  candidates: readonly PlayerListEntry[];
  /** Candidats avant troncature à 30. */
  candidateTotal: number;
  query: string;
  seasonId: number;
  /** Nombre de joueurs de la base (0 : aucun joueur n'existe encore). */
  playerCount: number;
};

/** Joueurs non inscrits correspondant à la recherche (30 au plus, avec mention du total), ou l'état vide adapté. */
export function SeasonCandidateList({ candidates, candidateTotal, query, seasonId, playerCount }: SeasonCandidateListProps) {
  if (candidates.length === 0) {
    if (playerCount === 0) {
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="font-bold">{SEASON_MESSAGES.noPlayerAtAll}</p>
          <Link
            href={buildAdminHref("player", "create")}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
          >
            Créer un joueur
          </Link>
        </div>
      );
    }
    return (
      <p className="font-bold">{query === "" ? SEASON_MESSAGES.allEnrolled : SEASON_MESSAGES.noCandidateMatch(query)}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col border-t-2 border-rpb-ink">
        {candidates.map((entry) => (
          <SeasonParticipantRow key={entry.player.licence} entry={entry} seasonId={seasonId} intent="add" />
        ))}
      </ul>
      {candidateTotal > candidates.length && (
        <p className="text-sm text-rpb-ink/72">{SEASON_MESSAGES.truncated(candidates.length, candidateTotal)}</p>
      )}
    </div>
  );
}
