import { compareGamesByDate } from "@/models/compareGamesByDate";
import type { Game } from "@/models/Game";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PlayerStatLine } from "@/models/PlayerStatLine";
import type { RpbTeam } from "@/models/RpbTeam";
import { toCalendarGame } from "@/models/toCalendarGame";

type Group = { lines: PlayerStatLine[]; firstLineId: number };

/**
 * Journal de matchs du joueur : lignes regroupées par `gameId` (jamais par l'id de ligne, P5), jointes au match
 * (statut et résultat du point de vue du RPB de la saison). Ordre chronologique ; matchs inconnus en fin.
 */
export function buildGameLog(
  lines: readonly PlayerStatLine[],
  games: readonly Game[],
  rpbTeams: ReadonlyMap<number, RpbTeam | null>,
  today: string,
): GameLogEntry[] {
  const groups = new Map<number, Group>();
  for (const line of lines) {
    const group = groups.get(line.gameId);
    if (group) {
      group.lines.push(line);
      group.firstLineId = Math.min(group.firstLineId, line.lineId);
    } else {
      groups.set(line.gameId, { lines: [line], firstLineId: line.lineId });
    }
  }

  const gamesById = new Map(games.map((game) => [game.id, game]));
  const entries = [...groups.values()].map(({ lines: gameLines, firstLineId }) => {
    const [first] = gameLines;
    const game = gamesById.get(first.gameId);
    const minutes = gameLines.map((line) => line.playingTimeSeconds).filter((value) => value !== null);
    const entry: GameLogEntry = {
      gameId: first.gameId,
      seasonId: first.seasonId,
      gameLabel: first.gameLabel,
      overview: game ? toCalendarGame(game, rpbTeams.get(first.seasonId) ?? null, today) : null,
      lineCount: gameLines.length,
      playingTimeSeconds: minutes.length === 0 ? null : minutes.reduce((total, value) => total + value, 0),
      periods: gameLines.flatMap((line) => line.periods),
    };
    return { entry, firstLineId };
  });

  return entries
    .sort((a, b) => {
      const gameA = a.entry.overview?.game;
      const gameB = b.entry.overview?.game;
      if (gameA && gameB) return compareGamesByDate(gameA, gameB);
      if (gameA) return -1;
      if (gameB) return 1;
      return a.firstLineId - b.firstLineId;
    })
    .map(({ entry }) => entry);
}
