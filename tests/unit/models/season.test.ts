import { describe, expect, it } from "vitest";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { resolveSelectedSeason } from "@/models/resolveSelectedSeason";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import { makeSeason } from "./factories";

const older = makeSeason({ id: 1, startYear: 2024, endYear: 2025 });
const recent = makeSeason({ id: 4, startYear: 2025, endYear: 2026 });
const recentOtherTeam = makeSeason({ id: 7, startYear: 2025, endYear: 2026 });

describe("sortSeasonsByRecency", () => {
  it("trie par année de début décroissante puis par id décroissant", () => {
    expect(sortSeasonsByRecency([older, recent, recentOtherTeam]).map((s) => s.id)).toEqual([7, 4, 1]);
  });

  it("ne mute pas l'entrée", () => {
    const input = [older, recent];
    sortSeasonsByRecency(input);
    expect(input.map((s) => s.id)).toEqual([1, 4]);
  });
});

describe("resolveSelectedSeason", () => {
  const accessible = [older, recent];

  it("renvoie la saison demandée si elle est accessible", () => {
    expect(resolveSelectedSeason(accessible, "1")).toBe(older);
  });

  it("renvoie la plus récente si la saison demandée est hors du périmètre", () => {
    expect(resolveSelectedSeason(accessible, "99")).toBe(recent);
  });

  it.each(["abc", "4.5", "", " 4", "-4", undefined])("renvoie la plus récente pour %j", (requested) => {
    expect(resolveSelectedSeason(accessible, requested)).toBe(recent);
  });

  it("renvoie null si aucune saison n'est accessible", () => {
    expect(resolveSelectedSeason([], "4")).toBeNull();
  });
});

describe("formatSeasonLabel", () => {
  it("assemble années, championnat et catégorie", () => {
    expect(formatSeasonLabel(makeSeason())).toBe("2025-2026 · Régional 2 · U17");
  });

  it("omet un segment vide", () => {
    expect(formatSeasonLabel(makeSeason({ championship: " " }))).toBe("2025-2026 · U17");
    expect(formatSeasonLabel(makeSeason({ category: "" }))).toBe("2025-2026 · Régional 2");
  });
});
