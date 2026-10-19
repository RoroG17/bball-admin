export const IMPACT_KINDS = [
  "player",
  "account",
  "team",
  "season",
  "game",
  "participation",
  "statLine",
  "exam",
  "measurement",
] as const;
export type ImpactKind = (typeof IMPACT_KINDS)[number];

/** `count: null` = non calculable : ne jamais afficher un 0 faux. */
export type ImpactLine = { kind: ImpactKind; count: number | null };
export type DeletionImpact = { lines: readonly ImpactLine[]; complete: boolean };

export const IMPACT_LABELS: Record<ImpactKind, { one: string; other: string }> = {
  player: { one: "joueur", other: "joueurs" },
  account: { one: "compte utilisateur", other: "comptes utilisateurs" },
  team: { one: "équipe", other: "équipes" },
  season: { one: "saison", other: "saisons" },
  game: { one: "match", other: "matchs" },
  participation: { one: "inscription à une saison", other: "inscriptions à une saison" },
  statLine: {
    one: "ligne de statistiques de match (tirs compris)",
    other: "lignes de statistiques de match (tirs compris)",
  },
  exam: { one: "examen de tir", other: "examens de tir" },
  measurement: { one: "mesure physique", other: "mesures physiques" },
};
