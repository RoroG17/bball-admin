import Link from "next/link";
import { cx } from "@/lib/cx";
import { buildAccountCreateHref } from "@/models/buildAccountCreateHref";
import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

type AccountPlayerOptionProps = {
  entry: PlayerListEntry;
  q: string;
  selected: boolean;
};

/** Un joueur du sélecteur : un lien qui choisit ce joueur (`?joueur=`) en gardant la recherche. Cible de 48 px. */
export function AccountPlayerOption({ entry, q, selected }: AccountPlayerOptionProps) {
  return (
    <li className="border-b border-rpb-ink/12">
      <Link
        href={buildAccountCreateHref({ q, licence: entry.player.licence })}
        aria-current={selected ? "true" : undefined}
        className={cx(
          "flex min-h-12 items-center gap-2 px-3 py-2 text-[15px]/[22px] font-semibold text-rpb-ink no-underline transition-colors hover:bg-rpb-gold-light focus-ring",
          selected && "bg-rpb-gold-light",
        )}
      >
        <span className="min-w-0 wrap-anywhere">
          {formatPlayerName(entry.player)}, {entry.team.name}
        </span>
        {selected && <span className="ml-auto shrink-0 text-xs font-bold">Choisi</span>}
      </Link>
    </li>
  );
}
