import type { DeletionImpact } from "@/models/DeletionImpact";

/** Une valeur `null` = lecture impossible : jamais converti en 0. */
export type PlayerDeletionFigures = {
  accountCount: number | null;
  seasonCount: number | null;
  statLineCount: number | null;
  examCount: number | null;
  measurementCount: number | null;
};

/**
 * Ce que la suppression d'un joueur emporte (cascade complète, D-ADM-1). Les tirs sont inclus dans les lignes de stats
 * et les examens : toutes les dépendances sont énumérées, `complete: true`.
 */
export function computePlayerDeletionImpact(figures: PlayerDeletionFigures): DeletionImpact {
  return {
    lines: [
      { kind: "account", count: figures.accountCount },
      { kind: "participation", count: figures.seasonCount },
      { kind: "statLine", count: figures.statLineCount },
      { kind: "exam", count: figures.examCount },
      { kind: "measurement", count: figures.measurementCount },
    ],
    complete: true,
  };
}
