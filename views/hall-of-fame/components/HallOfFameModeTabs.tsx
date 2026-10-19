"use client";

import { useSearchParams } from "next/navigation";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { animationDelay } from "@/lib/animationDelay";
import { buildHallOfFameHref } from "@/models/buildHallOfFameHref";
import { getAdjacentHallOfFameMode, type HallOfFameModeMove } from "@/models/getAdjacentHallOfFameMode";
import { HALL_OF_FAME_MODES, type HallOfFameMode } from "@/models/HallOfFameMode";
import { parseHallOfFameMode } from "@/models/parseHallOfFameMode";
import { HallOfFameModeTab } from "@/views/hall-of-fame/components/HallOfFameModeTab";

type HallOfFameModeTabsProps = {
  /** Un panneau rendu côté serveur par mode : la bascule n'émet aucune requête. */
  panels: Record<HallOfFameMode, ReactNode>;
};

const KEY_MOVES: Record<string, HallOfFameModeMove> = {
  ArrowRight: "next",
  ArrowLeft: "previous",
  Home: "first",
  End: "last",
};

/** Mode dérivé de l'URL (jamais d'état local), écrit sans entrée d'historique ni requête serveur. */
export function HallOfFameModeTabs({ panels }: HallOfFameModeTabsProps) {
  const searchParams = useSearchParams();
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<HallOfFameMode, HTMLButtonElement | null>>>({});
  const mode = parseHallOfFameMode(searchParams.get("mode"));

  function select(next: HallOfFameMode) {
    const href = buildHallOfFameHref(next, new URLSearchParams(window.location.search));
    window.history.replaceState(null, "", href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: HallOfFameMode) {
    const move = KEY_MOVES[event.key];
    if (!move) return;
    event.preventDefault();
    const next = getAdjacentHallOfFameMode(current, move);
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div
        role="tablist"
        aria-label="Mode de classement"
        className="reveal flex w-fit max-w-full flex-wrap gap-1 rounded-lg border-2 border-rpb-ink bg-rpb-cream p-1"
        style={animationDelay(80)}
      >
        {HALL_OF_FAME_MODES.map((tabMode) => (
          <HallOfFameModeTab
            key={tabMode}
            mode={tabMode}
            selected={tabMode === mode}
            tabId={`${baseId}-tab-${tabMode}`}
            panelId={`${baseId}-panel-${tabMode}`}
            onSelect={select}
            onKeyDown={handleKeyDown}
            tabRef={(element) => {
              tabRefs.current[tabMode] = element;
            }}
          />
        ))}
      </div>
      {HALL_OF_FAME_MODES.map((panelMode) => (
        <div
          key={panelMode}
          role="tabpanel"
          id={`${baseId}-panel-${panelMode}`}
          aria-labelledby={`${baseId}-tab-${panelMode}`}
          tabIndex={0}
          hidden={panelMode !== mode}
          className="focus-ring"
        >
          {panels[panelMode]}
        </div>
      ))}
    </div>
  );
}
