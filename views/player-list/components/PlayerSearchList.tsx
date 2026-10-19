"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { pluralize } from "@/lib/format";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import { PLAYER_GRID_CLASSES } from "@/views/player-list/components/playerListLayout";
import { PlayerCard } from "@/views/player-list/components/PlayerCard";
import { PlayerSearchField } from "@/views/player-list/components/PlayerSearchField";

type PlayerSearchListProps = {
  entries: PlayerListEntry[];
  /** Saison à conserver dans le lien de la fiche, ou `null`. */
  seasonParam: string | null;
};

/** Recherche instantanée, non reflétée dans l'URL (D13). Les cartes n'entrent en cascade qu'avant la première frappe. */
export function PlayerSearchList({ entries, seasonParam }: PlayerSearchListProps) {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const visible = filterPlayersByName(entries, query);

  function handleChange(next: string) {
    setHasSearched(true);
    setQuery(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayerSearchField value={query} onChange={handleChange} />
      <p aria-live="polite" className="text-[13px]/[18px] text-rpb-ink/72 tabular-nums">
        {pluralize(visible.length, "joueur affiché", "joueurs affichés")}
      </p>
      {visible.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={40} strokeWidth={1.6} />}
          title={`Aucun joueur ne correspond à « ${query.trim()} ».`}
        />
      ) : (
        <ul className={`m-0 list-none p-0 ${PLAYER_GRID_CLASSES}`}>
          {visible.map((entry, index) => (
            <PlayerCard
              key={entry.player.licence}
              entry={entry}
              seasonParam={seasonParam}
              animationIndex={hasSearched ? null : index}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
