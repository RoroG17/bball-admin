import type { TeamStat } from "@/models/TeamStat";

/** Valeurs Q1, Q2, Q3, Q4. */
export type QuarterValues = readonly [number, number, number, number];

export type QuarterAverages = Record<TeamStat, QuarterValues>;
