import Link from "next/link";
import { animationDelay } from "@/lib/animationDelay";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { PLAYER_TAB_LABELS, type PlayerTab } from "@/models/PlayerTab";

type PlayerTabsNavProps = {
  licence: string;
  tabs: PlayerTab[];
  activeTab: PlayerTab;
  seasonParam: string;
};

/** Liens (pas de JS) : l'onglet actif est marqué par `aria-current`, un soulignement et le gras. Toujours rendue (DS49). */
export function PlayerTabsNav({ licence, tabs, activeTab, seasonParam }: PlayerTabsNavProps) {
  return (
    <nav aria-label="Sections de la fiche" className="reveal -m-2 overflow-x-auto p-2" style={animationDelay(340)}>
      <ul className="m-0 flex min-w-max list-none gap-1 border-b-2 border-rpb-ink/14 p-0">
        {tabs.map((tab) => (
          <li key={tab}>
            <Link
              href={buildPlayerHref(licence, { saison: seasonParam, onglet: tab })}
              aria-current={tab === activeTab ? "page" : undefined}
              className="-mb-0.5 inline-flex min-h-12 items-center border-b-4 border-transparent px-4 text-base font-semibold text-rpb-ink/72 no-underline transition-colors focus-ring hover:border-rpb-ink/30 hover:text-rpb-ink aria-[current=page]:border-rpb-bordeaux aria-[current=page]:font-bold aria-[current=page]:text-rpb-bordeaux"
            >
              {PLAYER_TAB_LABELS[tab]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
