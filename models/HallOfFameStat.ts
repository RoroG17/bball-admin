import type { HallOfFameCategory } from "@/models/HallOfFameCategory";
import type { HallOfFameEntry } from "@/models/HallOfFameEntry";
import type { HallOfFameMode } from "@/models/HallOfFameMode";

export type HallOfFameStat = {
  category: HallOfFameCategory;
  /** Une liste (10 entrées au plus, éventuellement vide) par mode. */
  rankings: Record<HallOfFameMode, HallOfFameEntry[]>;
};
