import { SEASON_MESSAGES } from "@/models/seasonMessages";

/** « Plus récente » : information, jamais une promesse de « saison courante » (D-S2). Texte, jamais la couleur seule. */
export function SeasonRecencyBadge() {
  return (
    <span
      title={SEASON_MESSAGES.recencyBadgeTitle}
      className="inline-flex items-center rounded-full border-2 border-rpb-bordeaux px-[9px] py-px text-xs font-bold text-rpb-bordeaux"
    >
      {SEASON_MESSAGES.recencyBadge}
      <span className="sr-only"> : {SEASON_MESSAGES.recencyBadgeTitle}</span>
    </span>
  );
}
