import type { RankingCategory } from "@/models/RankingCategory";
import type { RankingEntry } from "@/models/RankingEntry";

export type Ranking = { category: RankingCategory; entries: RankingEntry[] };
