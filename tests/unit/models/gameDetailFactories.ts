import type { PeriodStats } from "@/models/PeriodStats";
import type { PlayerGameStats } from "@/models/PlayerGameStats";
import type { Shot } from "@/models/Shot";

type PeriodOverrides = Partial<Omit<PeriodStats, "twoPoints" | "threePoints" | "freeThrows">> & {
  twoPoints?: Partial<PeriodStats["twoPoints"]>;
  threePoints?: Partial<PeriodStats["threePoints"]>;
  freeThrows?: Partial<PeriodStats["freeThrows"]>;
};

export function makePeriodStats(overrides: PeriodOverrides = {}): PeriodStats {
  const { twoPoints, threePoints, freeThrows, ...rest } = overrides;
  return {
    period: 1,
    assists: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    passes: { completed: 0, missed: 0 },
    ...rest,
    twoPoints: { made: 0, missed: 0, ...twoPoints },
    threePoints: { made: 0, missed: 0, ...threePoints },
    freeThrows: { made: 0, missed: 0, ...freeThrows },
  };
}

/** Quatre quart-temps vides, sauf ceux fournis (indexés par période). */
export function makePlayerGameStats(
  overrides: Partial<Omit<PlayerGameStats, "player" | "periods">> & {
    licence?: string;
    lastName?: string;
    firstName?: string;
    periods?: PeriodOverrides[];
  } = {},
): PlayerGameStats {
  const { licence = "LIC1", lastName = "MARTIN", firstName = "Lucas", periods = [], ...rest } = overrides;
  const byPeriod = new Map(periods.map((stats) => [stats.period ?? 1, stats]));
  return {
    lineId: 1,
    playingTimeSeconds: 600,
    ...rest,
    player: { licence, lastName, firstName, photoUrl: null },
    periods: [1, 2, 3, 4].map((period) => makePeriodStats({ ...byPeriod.get(period), period })),
  };
}

export function makeShot(overrides: Partial<Shot> = {}): Shot {
  return { id: "1:a", playerLicence: "LIC1", period: 1, made: true, position: { x: 0.5, y: 0.5 }, ...overrides };
}
