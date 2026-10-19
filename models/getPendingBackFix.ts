import type { HallOfFameCategoryKey } from "@/models/HallOfFameCategory";
import type { HallOfFameMode } from "@/models/HallOfFameMode";
import { PENDING_BACK_FIXES, type PendingBackFix } from "@/models/hallOfFamePendingFixes";

/** Correction du back en attente pour cette carte, ou `null`. */
export function getPendingBackFix(key: HallOfFameCategoryKey, mode: HallOfFameMode): PendingBackFix | null {
  return PENDING_BACK_FIXES.find((fix) => fix.categories.includes(key) && fix.modes.includes(mode)) ?? null;
}
