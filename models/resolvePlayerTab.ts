import { PLAYER_TAB_PARAMS, type PlayerTab } from "@/models/PlayerTab";

/** Onglet de `?onglet=` s'il est visible ; sinon (absent, inconnu, non autorisé) Statistiques. */
export function resolvePlayerTab(requested: string | undefined, visible: readonly PlayerTab[]): PlayerTab {
  return visible.find((tab) => PLAYER_TAB_PARAMS[tab] === requested) ?? "statistics";
}
