import { describe, expect, it } from "vitest";
import { buildFieldGoalAttempts } from "@/models/buildFieldGoalAttempts";
import { buildShotPlayerOptions } from "@/models/buildShotPlayerOptions";
import { countFieldGoalAttempts } from "@/models/countFieldGoalAttempts";
import { describeShotChart } from "@/models/describeShotChart";
import { describeShotScope } from "@/models/describeShotScope";
import { filterShots } from "@/models/filterShots";
import { getInitialShotFilter } from "@/models/getInitialShotFilter";
import { normalizeShotPosition } from "@/models/normalizeShotPosition";
import { summarizeShots } from "@/models/summarizeShots";
import { makePlayerGameStats, makeShot } from "./gameDetailFactories";

describe("normalizeShotPosition", () => {
  it("ramène le repère V1 dans [0, 1]", () => {
    expect(normalizeShotPosition({ x: 25, y: 25 })).toEqual({ x: 0, y: 0 });
    expect(normalizeShotPosition({ x: 775, y: 555 })).toEqual({ x: 1, y: 1 });
    const basket = normalizeShotPosition({ x: 400, y: 79.6 });
    expect(basket.x).toBeCloseTo(0.5);
    expect(basket.y).toBeCloseTo(0.103, 3);
  });

  it("borne un tir hors terrain", () => {
    expect(normalizeShotPosition({ x: 790, y: 0 })).toEqual({ x: 1, y: 0 });
  });
});

const shots = [
  makeShot({ id: "a", playerLicence: "L1", period: 1, made: true }),
  makeShot({ id: "b", playerLicence: "L1", period: 3, made: false }),
  makeShot({ id: "c", playerLicence: "L2", period: 3, made: true }),
];

describe("filterShots / summarizeShots", () => {
  it("filtre par joueur, période, ou les deux", () => {
    expect(filterShots(shots, { side: "team", playerLicence: null, period: null })).toHaveLength(3);
    expect(filterShots(shots, { side: "team", playerLicence: "L1", period: null }).map((s) => s.id)).toEqual(["a", "b"]);
    expect(filterShots(shots, { side: "team", playerLicence: null, period: 3 }).map((s) => s.id)).toEqual(["b", "c"]);
    expect(filterShots(shots, { side: "team", playerLicence: "L2", period: 1 })).toEqual([]);
  });

  it("compte les réussis", () => {
    expect(summarizeShots(shots)).toEqual({ made: 2, total: 3 });
    expect(summarizeShots([])).toEqual({ made: 0, total: 0 });
  });
});

describe("tentatives à 2 et 3 points", () => {
  const lines = [
    makePlayerGameStats({
      licence: "L1",
      periods: [{ period: 1, twoPoints: { made: 1, missed: 2 }, threePoints: { made: 0, missed: 1 }, freeThrows: { made: 4, missed: 2 } }],
    }),
    makePlayerGameStats({ lineId: 2, licence: "L2", periods: [{ period: 3, twoPoints: { made: 2, missed: 0 } }] }),
  ];
  const attempts = buildFieldGoalAttempts(lines);

  it("une entrée par ligne et par période, lancers francs exclus", () => {
    expect(attempts).toHaveLength(8);
    expect(attempts.find((entry) => entry.playerLicence === "L1" && entry.period === 1)?.attempted).toBe(4);
  });

  it("somme selon le filtre", () => {
    expect(countFieldGoalAttempts(attempts, { side: "team", playerLicence: null, period: null })).toBe(6);
    expect(countFieldGoalAttempts(attempts, { side: "team", playerLicence: "L2", period: null })).toBe(2);
    expect(countFieldGoalAttempts(attempts, { side: "team", playerLicence: null, period: 2 })).toBe(0);
  });
});

describe("options et filtre initial", () => {
  const lines = [
    makePlayerGameStats({ lineId: 1, licence: "L1", lastName: "MARTIN", firstName: "Lucas" }),
    makePlayerGameStats({ lineId: 2, licence: "L2", lastName: "BERNARD", firstName: "Hugo" }),
    makePlayerGameStats({ lineId: 3, licence: "L1", lastName: "MARTIN", firstName: "Lucas" }),
    makePlayerGameStats({ lineId: 4, licence: "L4", lastName: "PETIT", firstName: "Arthur" }),
  ];
  const options = buildShotPlayerOptions(lines, shots);

  it("seuls les joueurs avec tirs, dédoublonnés, triés", () => {
    expect(options).toEqual([
      { licence: "L2", label: "Hugo BERNARD" },
      { licence: "L1", label: "Lucas MARTIN" },
    ]);
  });

  it("pré-filtre sur le joueur connecté s'il a des tirs", () => {
    expect(getInitialShotFilter("L1", options)).toEqual({ side: "team", playerLicence: "L1", period: null });
    expect(getInitialShotFilter("L4", options)).toEqual({ side: "team", playerLicence: null, period: null });
    expect(getInitialShotFilter(null, options)).toEqual({ side: "team", playerLicence: null, period: null });
  });

  it("décrit la portée du filtre", () => {
    expect(describeShotScope({ side: "team", playerLicence: null, period: null }, options)).toBe("Tous les joueurs, tous les quart-temps");
    expect(describeShotScope({ side: "team", playerLicence: "L1", period: 3 }, options)).toBe("Lucas MARTIN, quart-temps 3");
  });
});

describe("describeShotChart", () => {
  const scope = "Tous les joueurs, tous les quart-temps";

  it("carte complète", () => {
    expect(describeShotChart({ made: 8, total: 19 }, 19, scope)).toBe(
      "Tous les joueurs, tous les quart-temps : 8 tirs réussis sur 19 placés sur le terrain.",
    );
  });

  it("carte incomplète", () => {
    expect(describeShotChart({ made: 8, total: 19 }, 27, scope)).toBe(
      "Tous les joueurs, tous les quart-temps : 8 tirs réussis sur 19 placés sur le terrain. 19 tirs placés sur 27 tentés.",
    );
  });

  it("aucun tir", () => {
    expect(describeShotChart({ made: 0, total: 0 }, 5, scope)).toBe("Tous les joueurs, tous les quart-temps : aucun tir placé.");
  });
});

describe("équipe adverse", () => {
  const mixed = [
    makeShot({ id: "a", playerLicence: "L1", period: 1, made: true }),
    makeShot({ id: "o", playerLicence: "XXX", period: 1, made: false }),
  ];
  const mixedAttempts = [
    { playerLicence: "L1", period: 1, attempted: 2 },
    { playerLicence: "XXX", period: 1, attempted: 5 },
  ];

  it("sépare les tirs de mon équipe et ceux de l'adversaire", () => {
    expect(filterShots(mixed, { side: "team", playerLicence: null, period: null }).map((s) => s.id)).toEqual(["a"]);
    expect(filterShots(mixed, { side: "opponent", playerLicence: null, period: null }).map((s) => s.id)).toEqual(["o"]);
  });

  it("compte les tentatives de l'équipe choisie", () => {
    expect(countFieldGoalAttempts(mixedAttempts, { side: "team", playerLicence: null, period: null })).toBe(2);
    expect(countFieldGoalAttempts(mixedAttempts, { side: "opponent", playerLicence: null, period: null })).toBe(5);
  });

  it("décrit la portée", () => {
    expect(describeShotScope({ side: "opponent", playerLicence: null, period: null }, [])).toBe("Équipe adverse, tous les quart-temps");
  });
});
