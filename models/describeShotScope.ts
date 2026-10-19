import { formatPeriodLabel } from "@/models/formatPeriodLabel";
import type { ShotFilter } from "@/models/ShotFilter";
import type { ShotPlayerOption } from "@/models/ShotPlayerOption";

/** Portée du filtre de la carte : « Tous les joueurs, tous les quart-temps », « Lucas Martin, quart-temps 3 », « Équipe adverse, tous les quart-temps ». */
export function describeShotScope(filter: ShotFilter, options: readonly ShotPlayerOption[]): string {
  const player =
    filter.side === "opponent"
      ? "Équipe adverse"
      : filter.playerLicence === null
        ? "Tous les joueurs"
        : (options.find((option) => option.licence === filter.playerLicence)?.label ?? "Joueur");
  const period = filter.period === null ? "tous les quart-temps" : formatPeriodLabel(filter.period, "long").toLowerCase();
  return `${player}, ${period}`;
}
