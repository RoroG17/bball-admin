import { notFound } from "next/navigation";
import { pluralize } from "@/lib/format";
import { splitSeasonParticipants } from "@/models/splitSeasonParticipants";
import { listAllPlayers } from "@/repositories/PlayerRepository";
import { listSeasonParticipantLicences } from "@/repositories/SeasonRepository";
import { SeasonCandidateList } from "@/views/admin-season/components/SeasonCandidateList";
import { SeasonCandidateSearch } from "@/views/admin-season/components/SeasonCandidateSearch";
import { SeasonParticipantList } from "@/views/admin-season/components/SeasonParticipantList";

type SeasonParticipantsBlockProps = {
  seasonId: number;
  token: string;
  /** Recherche de candidats (`?q=`). */
  query: string;
};

/**
 * Inscrits (avec compteur) puis recherche et liste des candidats. Deux lectures indispensables (tous les joueurs et les
 * inscrits) : si l'une échoue le bloc lève (boundary + « Réessayer »). Saison disparue : « introuvable ».
 */
export async function SeasonParticipantsBlock({ seasonId, token, query }: SeasonParticipantsBlockProps) {
  const [players, enrolled] = await Promise.all([listAllPlayers(), listSeasonParticipantLicences(seasonId, token)]);
  if (enrolled === null) notFound();
  const { participants, candidates, candidateTotal } = splitSeasonParticipants(players, enrolled, query);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="participants-count" className="flex flex-col gap-3">
        <h3 id="participants-count" className="text-base font-bold tabular-nums">
          {pluralize(participants.length, "participant", "participants")}
        </h3>
        <SeasonParticipantList participants={participants} seasonId={seasonId} />
      </section>
      <section aria-labelledby="participants-add" className="flex flex-col gap-3">
        <h3 id="participants-add" className="text-base font-bold">
          Ajouter un joueur
        </h3>
        <SeasonCandidateSearch seasonId={seasonId} query={query} />
        <SeasonCandidateList
          candidates={candidates}
          candidateTotal={candidateTotal}
          query={query}
          seasonId={seasonId}
          playerCount={players.length}
        />
      </section>
    </div>
  );
}
