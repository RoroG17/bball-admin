import { describe, expect, it } from "vitest";
import { isActivePath } from "@/lib/isActivePath";
import { describePlayedGame } from "@/models/describePlayedGame";
import { describeQuarterPoints } from "@/models/describeQuarterPoints";
import { describeUpcomingGame } from "@/models/describeUpcomingGame";
import { formatQuarterList } from "@/models/formatQuarterList";
import { getUserInitials } from "@/models/getUserInitials";
import { makeGame } from "./factories";

describe("describePlayedGame", () => {
  it("décrit le score et le résultat", () => {
    expect(describePlayedGame(makeGame(78, 71, "RPB", "OTB"), "win", false)).toBe(
      "Dernier match, n°3 : RPB 78, OTB 71, victoire. Voir la fiche.",
    );
  });

  it("ne lit pas de score non saisi et signale le match du jour", () => {
    expect(describePlayedGame(makeGame(0, 0, "RPB", "OTB"), "notEntered", true)).toBe(
      "Match du jour, n°3 : RPB contre OTB, score à saisir. Voir la fiche.",
    );
  });

  it("omet le résultat quand il est inconnu", () => {
    expect(describePlayedGame(makeGame(50, 40, "A", "B"), "unknown", false)).toBe(
      "Dernier match, n°3 : A 50, B 40. Voir la fiche.",
    );
  });
});

describe("describeUpcomingGame", () => {
  it("place le RPB en premier et précise le lieu", () => {
    expect(describeUpcomingGame(makeGame(0, 0, "OTB", "RPB"), "away")).toBe(
      "Prochain match, n°3 : RPB contre OTB, samedi 21 février 2026, à l'extérieur. Voir la fiche.",
    );
    expect(describeUpcomingGame(makeGame(0, 0, "RPB", "OTB"), "home")).toContain("RPB contre OTB, samedi 21 février 2026, à domicile.");
  });

  it("garde l'ordre domicile / extérieur quand le côté est inconnu", () => {
    expect(describeUpcomingGame(makeGame(0, 0, "A", "B"), null)).toBe(
      "Prochain match, n°3 : A contre B, samedi 21 février 2026. Voir la fiche.",
    );
  });
});

describe("formatQuarterList", () => {
  it("liste les quarts-temps", () => {
    expect(formatQuarterList([2])).toBe("Q3");
    expect(formatQuarterList([1, 3])).toBe("Q2 et Q4");
    expect(formatQuarterList([0, 1, 2])).toBe("Q1, Q2 et Q3");
    expect(formatQuarterList([])).toBe("");
  });
});

describe("describeQuarterPoints", () => {
  it("donne les 4 valeurs et le meilleur quart-temps", () => {
    expect(describeQuarterPoints([13.8, 15.2, 15.24, 14.1], [2])).toBe(
      "Points marqués par quart-temps, en moyenne par match : Q1 13,8, Q2 15,2, Q3 15,2, Q4 14,1. Meilleur quart-temps : Q3.",
    );
  });
});

describe("getUserInitials", () => {
  it("prend les initiales d'un identifiant", () => {
    expect(getUserInitials("jean.dupont")).toBe("JD");
    expect(getUserInitials("coach")).toBe("CO");
    expect(getUserInitials("")).toBe("?");
  });
});

describe("isActivePath", () => {
  it("n'active l'accueil que sur /", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/games", "/")).toBe(false);
  });

  it("active une rubrique et ses sous-pages", () => {
    expect(isActivePath("/games/12", "/games")).toBe(true);
    expect(isActivePath("/gamesx", "/games")).toBe(false);
  });
});
