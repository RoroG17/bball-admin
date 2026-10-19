import type { Game } from "@/models/Game";
import type { Season } from "@/models/Season";

export function makeSeason(overrides: Partial<Season> = {}): Season {
  return { id: 1, startYear: 2025, endYear: 2026, championship: "Régional 2", category: "U17", teamId: 1, ...overrides };
}

export function makeGame(
  homeScore: number,
  awayScore: number,
  home = "RPB",
  away = "Adversaire",
  overrides: Partial<Omit<Game, "home" | "away">> & { homeTeamId?: number | null; awayTeamId?: number | null } = {},
): Game {
  const { homeTeamId = null, awayTeamId = null, ...gameOverrides } = overrides;
  return {
    id: 10,
    number: 3,
    date: "2026-02-21",
    home: { teamId: homeTeamId, name: home, logoUrl: null, score: homeScore },
    away: { teamId: awayTeamId, name: away, logoUrl: null, score: awayScore },
    ...gameOverrides,
  };
}
