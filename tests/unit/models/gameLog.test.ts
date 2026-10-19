import { describe, expect, it } from "vitest";
import { averagePlayingTime } from "@/models/averagePlayingTime";
import { buildGameLog } from "@/models/buildGameLog";
import { buildPlayerCounters } from "@/models/buildPlayerCounters";
import { compareToAverage } from "@/models/compareToAverage";
import { computeGameLogAverages } from "@/models/computeGameLogAverages";
import { computeGameLogPeriodAverages } from "@/models/computeGameLogPeriodAverages";
import { computeGameLogTotals } from "@/models/computeGameLogTotals";
import { describeStatComparison } from "@/models/describeStatComparison";
import { divideStatTotals } from "@/models/divideStatTotals";
import { filterGameLog } from "@/models/filterGameLog";
import { getLastGameEntry } from "@/models/getLastGameEntry";
import { getOpponentTeam } from "@/models/getOpponentTeam";
import { listGamePeriods } from "@/models/listGamePeriods";
import type { RpbTeam } from "@/models/RpbTeam";
import { sumPeriodStats } from "@/models/sumPeriodStats";
import { toCalendarGame } from "@/models/toCalendarGame";
import { makeGame, makeSeason } from "./factories";
import { makeGameLogEntry, makePlayerStatLine } from "./playerFactories";

const TODAY = "2026-03-01";
const RPB: RpbTeam = { id: 1, name: "FAC Basket" };
const rpbTeams = new Map<number, RpbTeam | null>([
  [4, RPB],
  [1, RPB],
]);

const early = makeGame(53, 34, "FAC Basket", "Coq Carlanais", { id: 36, date: "2025-11-08", number: 1 });
const late = makeGame(54, 50, "OTB", "FAC Basket", { id: 47, date: "2026-01-24", number: 9 });
const upcoming = makeGame(0, 0, "FAC Basket", "OTB", { id: 53, date: "2026-05-09", number: 18 });

describe("buildGameLog", () => {
  it("joint par Id_Match (jamais par l'id de ligne) et trie par date", () => {
    const log = buildGameLog(
      [
        makePlayerStatLine({ lineId: 36, gameId: 47 }),
        makePlayerStatLine({ lineId: 47, gameId: 36, periods: [{ period: 1, twoPoints: { made: 3, missed: 0 } }] }),
      ],
      [late, early],
      rpbTeams,
      TODAY,
    );
    expect(log.map((entry) => entry.gameId)).toEqual([36, 47]);
    expect(log[0].overview?.game.id).toBe(36);
    expect(sumPeriodStats(log[0].periods).points).toBe(6);
  });

  it("calcule statut et résultat du point de vue du RPB", () => {
    const log = buildGameLog(
      [makePlayerStatLine({ gameId: 36 }), makePlayerStatLine({ lineId: 2, gameId: 47 })],
      [early, late],
      rpbTeams,
      TODAY,
    );
    expect(log[0].overview).toMatchObject({ status: "played", rpbSide: "home", outcome: "win" });
    expect(log[1].overview).toMatchObject({ status: "played", rpbSide: "away", outcome: "loss" });
  });

  it("résultat inconnu quand l'équipe RPB de la saison est inconnue", () => {
    const log = buildGameLog([makePlayerStatLine({ gameId: 36 })], [early], new Map(), TODAY);
    expect(log[0].overview).toMatchObject({ rpbSide: null, outcome: "unknown" });
  });

  it("fusionne les doublons d'un même match", () => {
    const log = buildGameLog(
      [
        makePlayerStatLine({ lineId: 5, gameId: 36, playingTimeSeconds: 300, periods: [{ period: 1, assists: 2 }] }),
        makePlayerStatLine({ lineId: 6, gameId: 36, playingTimeSeconds: null, periods: [{ period: 1, assists: 1 }] }),
        makePlayerStatLine({ lineId: 7, gameId: 36, playingTimeSeconds: 200 }),
      ],
      [early],
      rpbTeams,
      TODAY,
    );
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ lineCount: 3, playingTimeSeconds: 500 });
    expect(log[0].periods).toHaveLength(12);
    expect(sumPeriodStats(log[0].periods).assists).toBe(3);
  });

  it("minutes null si toutes les lignes sont sans temps de jeu", () => {
    const log = buildGameLog(
      [
        makePlayerStatLine({ lineId: 5, gameId: 36, playingTimeSeconds: null }),
        makePlayerStatLine({ lineId: 6, gameId: 36, playingTimeSeconds: null }),
      ],
      [early],
      rpbTeams,
      TODAY,
    );
    expect(log[0].playingTimeSeconds).toBeNull();
  });

  it("place en fin les matchs absents de la liste, par plus petit id de ligne", () => {
    const log = buildGameLog(
      [
        makePlayerStatLine({ lineId: 9, gameId: 999 }),
        makePlayerStatLine({ lineId: 3, gameId: 998 }),
        makePlayerStatLine({ lineId: 1, gameId: 47 }),
      ],
      [late],
      rpbTeams,
      TODAY,
    );
    expect(log.map((entry) => [entry.gameId, entry.overview === null])).toEqual([
      [47, false],
      [998, true],
      [999, true],
    ]);
  });

  it("calcule le statut avec la date du jour", () => {
    const log = buildGameLog([makePlayerStatLine({ gameId: 53 })], [upcoming], rpbTeams, TODAY);
    expect(log[0].overview?.status).toBe("upcoming");
  });
});

describe("filterGameLog / getOpponentTeam", () => {
  const log = [makeGameLogEntry({ gameId: 1, seasonId: 1 }), makeGameLogEntry({ gameId: 2, seasonId: 4 })];

  it("filtre par saison, garde tout en carrière", () => {
    expect(filterGameLog(log, { kind: "season", season: makeSeason({ id: 4 }) }).map((e) => e.gameId)).toEqual([2]);
    expect(filterGameLog(log, { kind: "career" })).toHaveLength(2);
  });

  it("donne l'adversaire selon le côté du RPB", () => {
    expect(getOpponentTeam(toCalendarGame(early, RPB, TODAY))?.name).toBe("Coq Carlanais");
    expect(getOpponentTeam(toCalendarGame(late, RPB, TODAY))?.name).toBe("OTB");
    expect(getOpponentTeam(toCalendarGame(late, null, TODAY))).toBeNull();
  });
});

describe("totaux et moyennes du journal", () => {
  const log = [
    makeGameLogEntry({
      gameId: 1,
      playingTimeSeconds: 600,
      periods: [
        { period: 1, twoPoints: { made: 2, missed: 1 }, assists: null },
        { period: 3, freeThrows: { made: 1, missed: 1 }, fouls: 2 },
      ],
    }),
    makeGameLogEntry({
      gameId: 2,
      playingTimeSeconds: null,
      lineCount: 2,
      periods: [{ period: 3, threePoints: { made: 1, missed: 2 }, assists: 3 }],
    }),
  ];

  it("additionne sur toutes les périodes ou une seule, null compté 0", () => {
    const all = computeGameLogTotals(log, "all");
    expect(all).toMatchObject({ points: 8, assists: 3, fouls: 2 });
    expect(all.fieldGoals).toEqual({ made: 3, attempted: 6 });
    expect(computeGameLogTotals(log, 3)).toMatchObject({ points: 4, assists: 3 });
  });

  it("divise par le nombre de matchs (un doublon compte une fois)", () => {
    expect(computeGameLogAverages(log, "all")).toMatchObject({ points: 4, assists: 1.5 });
    expect(computeGameLogAverages([], "all")).toBeNull();
  });

  it("refuse un diviseur nul", () => {
    expect(() => divideStatTotals(computeGameLogTotals(log, "all"), 0)).toThrow(RangeError);
  });

  it("donne la moyenne par période", () => {
    const rows = computeGameLogPeriodAverages(log, listGamePeriods(log));
    expect(rows.map((row) => row.period)).toEqual([1, 2, 3, 4]);
    expect(rows[2].averages.points).toBe(2);
    expect(computeGameLogPeriodAverages([], [1, 2])).toEqual([]);
  });

  it("moyenne des minutes connues seulement", () => {
    expect(averagePlayingTime(log)).toBe(600);
    expect(averagePlayingTime([makeGameLogEntry({ playingTimeSeconds: 601 }), makeGameLogEntry({ playingTimeSeconds: 600 })])).toBe(
      601,
    );
    expect(averagePlayingTime([makeGameLogEntry({ playingTimeSeconds: null })])).toBeNull();
  });
});

describe("getLastGameEntry", () => {
  const known = (gameId: number, game = early) => makeGameLogEntry({ gameId, overview: toCalendarGame(game, RPB, TODAY) });

  it("renvoie null pour un journal vide", () => {
    expect(getLastGameEntry([])).toBeNull();
  });

  it("prend le dernier match connu, en ignorant les matchs inconnus placés en fin", () => {
    expect(getLastGameEntry([known(36), known(47, late), makeGameLogEntry({ gameId: 999 })])?.gameId).toBe(47);
  });

  it("à défaut de match connu, prend la dernière entrée", () => {
    expect(getLastGameEntry([makeGameLogEntry({ gameId: 998 }), makeGameLogEntry({ gameId: 999 })])?.gameId).toBe(999);
  });
});

describe("compareToAverage / describeStatComparison", () => {
  it("compare à la moyenne arrondie à une décimale", () => {
    expect(compareToAverage(12, 11.24)).toBe("above");
    expect(compareToAverage(11, 11.24)).toBe("below");
    expect(compareToAverage(11.2, 11.24)).toBe("equal");
    expect(compareToAverage(11, 11.04)).toBe("equal");
    expect(compareToAverage(5, null)).toBe("noAverage");
  });

  it("décrit la comparaison pour les lecteurs d'écran", () => {
    expect(describeStatComparison("Points", "18", "above", "11,2")).toBe(
      "Points : 18, au-dessus de sa moyenne de saison (11,2)",
    );
    expect(describeStatComparison("Contres", "0", "below", "1")).toBe("Contres : 0, en dessous de sa moyenne de saison (1)");
    expect(describeStatComparison("Rebonds", "4", "equal", "4")).toBe("Rebonds : 4, égal à sa moyenne de saison (4)");
    expect(describeStatComparison("Points", "18", "noAverage", "—")).toBe("Points : 18 (pas de moyenne)");
  });
});

describe("buildPlayerCounters", () => {
  it("compte les matchs de la sélection et le total, masque les examens", () => {
    const log = [
      makeGameLogEntry({ gameId: 1, seasonId: 1 }),
      makeGameLogEntry({ gameId: 2, seasonId: 4, lineCount: 2 }),
      makeGameLogEntry({ gameId: 3, seasonId: 4 }),
    ];
    expect(
      buildPlayerCounters({ log, selection: { kind: "season", season: makeSeason({ id: 4 }) }, examCount: null, seasonCount: 2 }),
    ).toEqual({ selectionGames: 2, totalGames: 3, exams: null, seasons: 2 });
    expect(buildPlayerCounters({ log, selection: { kind: "career" }, examCount: 4, seasonCount: 2 })).toMatchObject({
      selectionGames: 3,
      exams: 4,
    });
  });
});
