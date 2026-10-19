import type { PlayerListEntry } from "@/models/PlayerListEntry";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
import { SeasonParticipantRow } from "@/views/admin-season/components/SeasonParticipantRow";

type SeasonParticipantListProps = {
  participants: readonly PlayerListEntry[];
  seasonId: number;
};

/** Joueurs inscrits sur la saison (jamais filtrés par la recherche), ou l'état vide. */
export function SeasonParticipantList({ participants, seasonId }: SeasonParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border-2 border-dashed border-rpb-ink/30 px-4 py-5">
        <p className="font-bold">{SEASON_MESSAGES.participantsEmpty}</p>
        <p className="text-sm text-rpb-ink/72">{SEASON_MESSAGES.participantsEmptyHint}</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col border-t-2 border-rpb-ink">
      {participants.map((entry) => (
        <SeasonParticipantRow key={entry.player.licence} entry={entry} seasonId={seasonId} intent="remove" />
      ))}
    </ul>
  );
}
