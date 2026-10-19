import { matchesShotSide } from "@/models/matchesShotSide";
import type { Shot } from "@/models/Shot";
import type { ShotFilter } from "@/models/ShotFilter";

export function filterShots(shots: readonly Shot[], { side, playerLicence, period }: ShotFilter): Shot[] {
  return shots.filter(
    (shot) =>
      matchesShotSide(shot.playerLicence, side) &&
      (playerLicence === null || shot.playerLicence === playerLicence) &&
      (period === null || shot.period === period),
  );
}
