import { PLAYER_PICKER_LIMIT } from "@/models/AccountRules";
import type { PlayerListEntry } from "@/models/PlayerListEntry";

/** Les 50 premiers joueurs du sélecteur et le total avant coupe (pour « 50 sur 87 joueurs »). */
export function limitPickerPlayers(players: readonly PlayerListEntry[]): { shown: PlayerListEntry[]; total: number } {
  return { shown: players.slice(0, PLAYER_PICKER_LIMIT), total: players.length };
}
