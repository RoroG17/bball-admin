import type { KeyboardEvent } from "react";
import { HALL_OF_FAME_MODE_LABELS, type HallOfFameMode } from "@/models/HallOfFameMode";

type HallOfFameModeTabProps = {
  mode: HallOfFameMode;
  selected: boolean;
  tabId: string;
  panelId: string;
  onSelect: (mode: HallOfFameMode) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, mode: HallOfFameMode) => void;
  tabRef: (element: HTMLButtonElement | null) => void;
};

/**
 * Onglet du contrôle segmenté. L'onglet actif est marqué par `aria-selected`, le fond plein et le soulignement or :
 * jamais la couleur seule. Tous en `font-bold` et `border-b-4` : la taille ne bouge pas au changement.
 */
export function HallOfFameModeTab({ mode, selected, tabId, panelId, onSelect, onKeyDown, tabRef }: HallOfFameModeTabProps) {
  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      id={tabId}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(mode)}
      onKeyDown={(event) => onKeyDown(event, mode)}
      className="min-h-12 flex-auto rounded-md border-b-4 border-transparent px-4 text-[15px] font-bold text-rpb-ink transition-colors focus-ring not-aria-selected:hover:bg-rpb-gold-light aria-selected:border-rpb-gold aria-selected:bg-rpb-bordeaux aria-selected:text-rpb-cream"
    >
      {HALL_OF_FAME_MODE_LABELS[mode].tab}
    </button>
  );
}
