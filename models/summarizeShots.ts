import type { Shot } from "@/models/Shot";

export function summarizeShots(shots: readonly Shot[]): { made: number; total: number } {
  return { made: shots.filter((shot) => shot.made).length, total: shots.length };
}
