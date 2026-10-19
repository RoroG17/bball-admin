import { formatPlayerName } from "@/models/formatPlayerName";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { Shot } from "@/models/Shot";
import type { ShotPlayerOption } from "@/models/ShotPlayerOption";
import { sortPlayersByName } from "@/models/sortPlayersByName";

/** Joueurs ayant au moins un tir placé, dédoublonnés par licence, triés par nom puis prénom. */
export function buildShotPlayerOptions(lines: readonly PlayerGameStats[], shots: readonly Shot[]): ShotPlayerOption[] {
  const shooters = new Set(shots.map((shot) => shot.playerLicence));
  const players = new Map(lines.filter((line) => shooters.has(line.player.licence)).map((line) => [line.player.licence, line.player]));
  return sortPlayersByName([...players.values()]).map((player) => ({ licence: player.licence, label: formatPlayerName(player) }));
}
