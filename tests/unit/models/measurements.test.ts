import { describe, expect, it } from "vitest";
import { createAddMeasurementSchema } from "@/models/AddMeasurementInput";
import { buildTimeSeriesPoints } from "@/models/buildTimeSeriesPoints";
import { describeMeasurementRange } from "@/models/describeMeasurementRange";
import { describeMeasurementSummary } from "@/models/describeMeasurementSummary";
import { findDuplicateMeasurement } from "@/models/findDuplicateMeasurement";
import { isValidIsoDate } from "@/models/isValidIsoDate";
import { sortMeasurementsByDate } from "@/models/sortMeasurementsByDate";
import { summarizeMeasurements } from "@/models/summarizeMeasurements";
import { makeMeasurement } from "./playerFactories";

describe("sortMeasurementsByDate / summarizeMeasurements", () => {
  const measurements = [
    makeMeasurement({ id: "10", date: "2026-03-12", value: 182 }),
    makeMeasurement({ id: "2", date: "2026-01-05", value: 180 }),
    makeMeasurement({ id: "3", date: "2026-01-05", type: "vma", value: 13 }),
  ];

  it("trie par date puis id (ordre numérique)", () => {
    const sorted = sortMeasurementsByDate([
      makeMeasurement({ id: "10", date: "2026-01-05" }),
      makeMeasurement({ id: "9", date: "2026-01-05" }),
      makeMeasurement({ id: "1", date: "2026-03-01" }),
    ]);
    expect(sorted.map((m) => m.id)).toEqual(["9", "10", "1"]);
  });

  it("renvoie null sans mesure du type", () => {
    expect(summarizeMeasurements(measurements, "verticalJump")).toBeNull();
  });

  it("une mesure : pas de précédente", () => {
    expect(summarizeMeasurements(measurements, "vma")).toMatchObject({ previous: null, delta: null, count: 1 });
  });

  it("deux mesures : écart arrondi, positif, négatif ou nul", () => {
    expect(summarizeMeasurements(measurements, "height")).toMatchObject({ latest: { value: 182 }, delta: 2, count: 2 });
    const down = [makeMeasurement({ value: 62.45 }), makeMeasurement({ id: "2", date: "2026-02-01", value: 61.3 })];
    expect(summarizeMeasurements(down, "height")?.delta).toBe(-1.2);
    const flat = [makeMeasurement(), makeMeasurement({ id: "2", date: "2026-02-01" })];
    expect(summarizeMeasurements(flat, "height")?.delta).toBe(0);
  });

  it("même date : l'ordre des identifiants départage", () => {
    const sameDay = [makeMeasurement({ id: "5", value: 181 }), makeMeasurement({ id: "4", value: 179 })];
    expect(summarizeMeasurements(sameDay, "height")).toMatchObject({ latest: { id: "5" }, previous: { id: "4" } });
  });
});

describe("describeMeasurementSummary", () => {
  it("décrit la dernière valeur et l'écart", () => {
    const summary = summarizeMeasurements(
      [makeMeasurement({ date: "2026-01-05", value: 180 }), makeMeasurement({ id: "2", date: "2026-03-12", value: 182 })],
      "height",
    )!;
    expect(describeMeasurementSummary(summary)).toBe("Taille : 182 cm le 12 mars 2026, +2 cm depuis le 5 janvier 2026");
  });

  it("signe moins, stabilité et première mesure", () => {
    const down = summarizeMeasurements(
      [
        makeMeasurement({ type: "vma", date: "2026-01-05", value: 14 }),
        makeMeasurement({ id: "2", type: "vma", date: "2026-03-12", value: 13.5 }),
      ],
      "vma",
    )!;
    expect(describeMeasurementSummary(down)).toBe("VMA : 13,5 km/h le 12 mars 2026, −0,5 km/h depuis le 5 janvier 2026");
    const flat = summarizeMeasurements([makeMeasurement(), makeMeasurement({ id: "2", date: "2026-02-01" })], "height")!;
    expect(describeMeasurementSummary(flat)).toBe("Taille : 180 cm le 1 février 2026, stable depuis le 15 janvier 2026");
    const first = summarizeMeasurements([makeMeasurement({ type: "verticalJump", value: 48 })], "verticalJump")!;
    expect(describeMeasurementSummary(first)).toBe("Détente : 48 cm le 15 janvier 2026 (première mesure)");
  });
});

describe("isValidIsoDate", () => {
  it("vérifie le format et l'existence de la date", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("12/03/2026")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
});

describe("createAddMeasurementSchema", () => {
  const schema = createAddMeasurementSchema("2026-03-12");
  const valid = { licence: "LIC1000", type: "verticalJump", value: "62,5", date: "2026-03-12" };
  const errors = (input: Record<string, string>) => {
    const result = schema.safeParse(input);
    return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
  };

  it("accepte la virgule décimale et la date du jour", () => {
    expect(schema.parse(valid)).toEqual({ licence: "LIC1000", type: "verticalJump", value: 62.5, date: "2026-03-12" });
  });

  it("refuse une date future ou inexistante", () => {
    expect(errors({ ...valid, date: "2026-03-13" })).toEqual({ date: "La date ne peut pas être dans le futur." });
    expect(errors({ ...valid, date: "2026-02-30" })).toEqual({ date: "Saisis une date valide." });
  });

  it("refuse un type inconnu et une valeur non numérique", () => {
    expect(errors({ ...valid, type: "" })).toEqual({ type: "Choisis une mesure." });
    expect(errors({ ...valid, type: "Détente verticale" })).toEqual({ type: "Choisis une mesure." });
    expect(errors({ ...valid, value: "abc" })).toEqual({ value: "Saisis une valeur numérique." });
    expect(errors({ ...valid, value: "" })).toEqual({ value: "Saisis une valeur numérique." });
  });

  it("vérifie la plage du type, bornes incluses", () => {
    expect(errors({ ...valid, type: "height", value: "100" })).toEqual({});
    expect(errors({ ...valid, type: "height", value: "230" })).toEqual({});
    expect(errors({ ...valid, type: "height", value: "99,5" })).toEqual({
      value: "La taille doit être comprise entre 100 et 230 cm.",
    });
    expect(errors({ ...valid, type: "vma", value: "26" })).toEqual({
      value: "La VMA doit être comprise entre 5 et 25 km/h.",
    });
    expect(errors({ ...valid, value: "121" })).toEqual({ value: "La détente doit être comprise entre 5 et 120 cm." });
  });

  it("refuse une licence invalide", () => {
    expect(errors({ ...valid, licence: "a b" })).toEqual({ licence: "Ce joueur n'existe plus." });
  });

  it("décrit la plage du type", () => {
    expect(describeMeasurementRange("height")).toBe("Entre 100 et 230 cm.");
    expect(describeMeasurementRange("vma")).toBe("Entre 5 et 25 km/h.");
  });
});

describe("findDuplicateMeasurement", () => {
  const measurements = [makeMeasurement({ id: "1", type: "verticalJump", date: "2026-03-12", value: 62 })];

  it("trouve une mesure de même type à la même date", () => {
    expect(findDuplicateMeasurement(measurements, { type: "verticalJump", date: "2026-03-12" })?.id).toBe("1");
  });

  it("accepte un autre type à la même date", () => {
    expect(findDuplicateMeasurement(measurements, { type: "height", date: "2026-03-12" })).toBeNull();
  });
});

describe("buildTimeSeriesPoints", () => {
  const box = { width: 100, height: 50, padding: 10 };

  it("renvoie une liste vide sans point", () => {
    expect(buildTimeSeriesPoints([], box)).toEqual([]);
  });

  it("centre un point unique ou des dates identiques, ligne médiane pour des valeurs égales", () => {
    expect(buildTimeSeriesPoints([{ date: "2026-01-01", value: 3 }], box)).toEqual([
      { x: 50, y: 25, date: "2026-01-01", value: 3 },
    ]);
    const sameDay = buildTimeSeriesPoints(
      [
        { date: "2026-01-01", value: 3 },
        { date: "2026-01-01", value: 3 },
      ],
      box,
    );
    expect(sameDay.map((point) => [point.x, point.y])).toEqual([
      [50, 25],
      [50, 25],
    ]);
  });

  it("place l'abscisse proportionnellement au temps", () => {
    const points = buildTimeSeriesPoints(
      [
        { date: "2026-01-01", value: 0 },
        { date: "2026-01-04", value: 0.5 },
        { date: "2026-01-11", value: 1 },
      ],
      box,
      { min: 0, max: 1 },
    );
    expect(points.map((point) => point.x)).toEqual([10, 34, 90]);
    expect(points.map((point) => point.y)).toEqual([40, 25, 10]);
  });

  it("élargit le domaine de 5 % sans domaine imposé", () => {
    const points = buildTimeSeriesPoints(
      [
        { date: "2026-01-01", value: 0 },
        { date: "2026-01-02", value: 10 },
      ],
      box,
    );
    expect(points[0].y).toBeCloseTo(10 + (1 - 0.5 / 11) * 30, 5);
  });
});
