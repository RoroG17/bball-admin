import type { DuplicatePlayer } from "@/models/DuplicatePlayer";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerGameStats } from "@/models/PlayerGameStats";

const collator = new Intl.Collator("fr", { sensitivity: "base" });

/** Joueurs présents sur plusieurs lignes de la feuille (P3), triés par nom affiché. */
export function findDuplicatePlayers(lines: readonly PlayerGameStats[]): DuplicatePlayer[] {
  const byLicence = new Map<string, DuplicatePlayer>();
  for (const { player } of lines) {
    const entry = byLicence.get(player.licence);
    if (entry) entry.lineCount += 1;
    else byLicence.set(player.licence, { licence: player.licence, name: formatPlayerName(player), lineCount: 1 });
  }
  return [...byLicence.values()]
    .filter((entry) => entry.lineCount >= 2)
    .sort((a, b) => collator.compare(a.name, b.name));
}
