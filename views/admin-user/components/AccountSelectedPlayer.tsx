import Link from "next/link";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

type AccountSelectedPlayerProps = {
  entry: PlayerListEntry;
  clearHref: string;
};

/** « Joueur choisi : Paul Durand (FAC Basket) » et le lien pour en changer. */
export function AccountSelectedPlayer({ entry, clearHref }: AccountSelectedPlayerProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border-2 border-rpb-ink px-4 py-3">
      <p className="text-[15px]/[22px] font-semibold">
        Joueur choisi : {formatPlayerName(entry.player)} ({entry.team.name})
      </p>
      <Link
        href={clearHref}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
      >
        Changer de joueur
      </Link>
    </div>
  );
}
