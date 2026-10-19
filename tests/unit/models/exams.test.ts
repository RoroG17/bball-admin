import { describe, expect, it } from "vitest";
import { computeExamZoneTrend } from "@/models/computeExamZoneTrend";
import { describeExamShotMap } from "@/models/describeExamShotMap";
import { describeExamZoneTrend } from "@/models/describeExamZoneTrend";
import { parseShotZone } from "@/models/parseShotZone";
import { sortExamsByDate } from "@/models/sortExamsByDate";
import { summarizeExam } from "@/models/summarizeExam";
import { makeExam, makeExamShot } from "./playerFactories";

describe("parseShotZone", () => {
  it("reconnaît les trois zones de la V1, rien d'autre", () => {
    expect(parseShotZone("Paint")).toBe("paint");
    expect(parseShotZone("Mid-Range")).toBe("midRange");
    expect(parseShotZone("3-Point")).toBe("threePoint");
    expect(parseShotZone("Corner")).toBeNull();
    expect(parseShotZone("toString")).toBeNull();
  });
});

describe("sortExamsByDate", () => {
  const exams = [makeExam(3, "2026-02-10"), makeExam(1, "2025-12-02"), makeExam(2, "2026-02-10")];

  it("trie par date puis par id, dans les deux sens, sans muter", () => {
    expect(sortExamsByDate(exams, "asc").map((exam) => exam.id)).toEqual([1, 2, 3]);
    expect(sortExamsByDate(exams, "desc").map((exam) => exam.id)).toEqual([3, 2, 1]);
    expect(exams.map((exam) => exam.id)).toEqual([3, 1, 2]);
  });
});

describe("summarizeExam", () => {
  it("compte par zone et au total, tirs sans zone compris", () => {
    const exam = makeExam(1, "2026-01-01", { paint: [8, 10], threePoint: [2, 8] });
    exam.shots.push(makeExamShot({ id: "x", zone: null, made: true }), makeExamShot({ id: "y", zone: null, made: false }));
    expect(summarizeExam(exam)).toEqual({
      total: { made: 11, attempted: 20 },
      zones: { paint: { made: 8, attempted: 10 }, midRange: { made: 0, attempted: 0 }, threePoint: { made: 2, attempted: 8 } },
      unknownZoneCount: 2,
    });
  });
});

describe("computeExamZoneTrend / describeExamZoneTrend", () => {
  it("demande au moins 3 examens avec des tirs dans la zone", () => {
    const exams = [
      makeExam(1, "2026-01-01", { threePoint: [2, 10] }),
      makeExam(2, "2026-01-08", { threePoint: [3, 10] }),
      makeExam(3, "2026-01-15", { paint: [5, 10] }),
    ];
    expect(computeExamZoneTrend(exams, "threePoint")).toBeNull();
  });

  it("détecte une progression, une baisse et la stabilité (seuil de 2 points)", () => {
    const rising = [
      makeExam(1, "2026-01-01", { threePoint: [3, 10] }),
      makeExam(2, "2026-01-15", { threePoint: [4, 10] }),
      makeExam(3, "2026-02-01", { threePoint: [5, 10] }),
    ];
    const trend = computeExamZoneTrend(rising, "threePoint");
    expect(trend).toEqual({
      examCount: 3,
      first: { date: "2026-01-01", ratio: 0.3 },
      last: { date: "2026-02-01", ratio: 0.5 },
      direction: "up",
    });
    expect(describeExamZoneTrend("threePoint", trend!)).toBe(
      "3 points : 30 % → 50 % sur les 3 derniers examens, en progression",
    );

    const falling = rising.map((exam, index) => makeExam(exam.id, exam.date, { paint: [8 - index * 2, 10] }));
    expect(computeExamZoneTrend(falling, "paint")?.direction).toBe("down");

    const flat = rising.map((exam, index) => makeExam(exam.id, exam.date, { midRange: [index === 1 ? 51 : 50, 100] }));
    expect(computeExamZoneTrend(flat, "midRange")?.direction).toBe("stable");
  });

  it("utilise l'échelle du temps, pas l'index des examens", () => {
    // 30 % puis 70 % deux jours plus tard, puis 32 % six mois après : la pente sur les jours est quasi nulle.
    const exams = [
      makeExam(1, "2025-09-01", { paint: [3, 10] }),
      makeExam(2, "2025-09-03", { paint: [7, 10] }),
      makeExam(3, "2026-03-01", { paint: [32, 100] }),
    ];
    expect(computeExamZoneTrend(exams, "paint")?.direction).toBe("down");
    const byIndexWouldBeUp = [
      makeExam(1, "2025-09-01", { paint: [3, 10] }),
      makeExam(2, "2026-02-27", { paint: [3, 10] }),
      makeExam(3, "2026-03-01", { paint: [6, 10] }),
    ];
    expect(computeExamZoneTrend(byIndexWouldBeUp, "paint")?.direction).toBe("up");
  });

  it("est stable si tous les examens sont le même jour", () => {
    const exams = [1, 2, 3].map((id) => makeExam(id, "2026-01-01", { paint: [id * 3, 10] }));
    expect(computeExamZoneTrend(exams, "paint")?.direction).toBe("stable");
  });
});

describe("describeExamShotMap", () => {
  it("résume l'examen, les zones vides et les tirs sans zone", () => {
    const exam = makeExam(1, "2026-03-12", { paint: [8, 10], midRange: [4, 12] });
    exam.shots.push(makeExamShot({ id: "x", zone: null, made: false }), makeExamShot({ id: "y", zone: null, made: true }));
    expect(describeExamShotMap(exam, summarizeExam(exam))).toBe(
      "Examen du 12 mars 2026 : 13 tirs réussis sur 24. Raquette 8/10, mi-distance 4/12, 3 points : aucun tir. + 2 tirs sans zone.",
    );
  });

  it("signale un examen sans tir", () => {
    const exam = makeExam(1, "2026-03-12");
    expect(describeExamShotMap(exam, summarizeExam(exam))).toBe("Examen du 12 mars 2026 : aucun tir.");
  });
});
