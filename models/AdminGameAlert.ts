import type { ScoreGap } from "@/models/computeScoreGap";
import type { DuplicatePlayer } from "@/models/DuplicatePlayer";

export type AdminGameAlert =
  | { kind: "scoreMissing" }
  | { kind: "statsMissing" }
  | { kind: "duplicatePlayers"; players: DuplicatePlayer[] }
  | { kind: "scoreGap"; gap: ScoreGap }
  | { kind: "invalidVideo"; raw: string }
  | { kind: "rpbSideUnknown" };
