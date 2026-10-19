import { formatHallOfFameModeParam } from "@/models/formatHallOfFameModeParam";
import type { HallOfFameMode } from "@/models/HallOfFameMode";

/**
 * Seul constructeur d'URL de la page : `/hall-of-fame` (mode par défaut) ou `/hall-of-fame?mode=carriere`.
 * `extra` : autres paramètres à conserver ; son éventuel `mode` est ignoré.
 */
export function buildHallOfFameHref(mode: HallOfFameMode, extra?: URLSearchParams): string {
  const query = new URLSearchParams(extra);
  query.delete("mode");
  const modeParam = formatHallOfFameModeParam(mode);
  const entries = modeParam === null ? [...query] : [["mode", modeParam], ...query];
  const search = new URLSearchParams(entries).toString();
  return `/hall-of-fame${search ? `?${search}` : ""}`;
}
