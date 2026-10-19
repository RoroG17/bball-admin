import type { FieldGoalAttempt } from "@/models/FieldGoalAttempt";
import { matchesShotSide } from "@/models/matchesShotSide";
import type { ShotFilter } from "@/models/ShotFilter";

export function countFieldGoalAttempts(
  attempts: readonly FieldGoalAttempt[],
  { side, playerLicence, period }: ShotFilter,
): number {
  return attempts
    .filter(
      (entry) =>
        matchesShotSide(entry.playerLicence, side) &&
        (playerLicence === null || entry.playerLicence === playerLicence) &&
        (period === null || entry.period === period),
    )
    .reduce((total, entry) => total + entry.attempted, 0);
}
