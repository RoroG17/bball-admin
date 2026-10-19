import type { Exam, ExamShot } from "@/models/Exam";
import type { GameLogEntry } from "@/models/GameLogEntry";
import type { PhysicalMeasurement } from "@/models/PhysicalMeasurement";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import type { PlayerStatLine } from "@/models/PlayerStatLine";
import { makePeriodStats } from "./gameDetailFactories";

type PeriodOverrides = Parameters<typeof makePeriodStats>[0];

/** Quatre quart-temps vides, sauf ceux fournis (indexés par période). */
function makePeriods(periods: PeriodOverrides[] = []) {
  const byPeriod = new Map(periods.map((stats) => [stats?.period ?? 1, stats]));
  return [1, 2, 3, 4].map((period) => makePeriodStats({ ...byPeriod.get(period), period }));
}

export function makePlayerListEntry(firstName: string, lastName: string, licence = `L${lastName}`): PlayerListEntry {
  return {
    player: { licence, firstName, lastName, photoUrl: null },
    team: { id: 1, name: "FAC Basket", logoUrl: null },
  };
}

export function makePlayerStatLine(
  overrides: Partial<Omit<PlayerStatLine, "periods">> & { periods?: PeriodOverrides[] } = {},
): PlayerStatLine {
  const { periods, ...rest } = overrides;
  return {
    lineId: 1,
    gameId: 10,
    seasonId: 4,
    gameLabel: "FAC Basket - Adversaire",
    playingTimeSeconds: 600,
    ...rest,
    periods: makePeriods(periods),
  };
}

export function makeGameLogEntry(
  overrides: Partial<Omit<GameLogEntry, "periods">> & { periods?: PeriodOverrides[] } = {},
): GameLogEntry {
  const { periods, ...rest } = overrides;
  return {
    gameId: 10,
    seasonId: 4,
    gameLabel: "FAC Basket - Adversaire",
    overview: null,
    lineCount: 1,
    playingTimeSeconds: 600,
    ...rest,
    periods: makePeriods(periods),
  };
}

export function makeExamShot(overrides: Partial<ExamShot> = {}): ExamShot {
  return { id: "1:1", made: true, position: { x: 0.5, y: 0.5 }, zone: "paint", ...overrides };
}

/** Examen dont la zone donnée compte `made` tirs réussis sur `attempted`. */
export function makeExam(
  id: number,
  date: string,
  shotsByZone: Partial<Record<ExamShot["zone"] & string, [made: number, attempted: number]>> = {},
): Exam {
  const shots = Object.entries(shotsByZone).flatMap(([zone, [made, attempted]]) =>
    Array.from({ length: attempted }, (_, index) =>
      makeExamShot({ id: `${id}:${zone}${index}`, zone: zone as ExamShot["zone"], made: index < made }),
    ),
  );
  return { id, date, shots };
}

export function makeMeasurement(overrides: Partial<PhysicalMeasurement> = {}): PhysicalMeasurement {
  return { id: "1", date: "2026-01-15", type: "height", value: 180, ...overrides };
}
