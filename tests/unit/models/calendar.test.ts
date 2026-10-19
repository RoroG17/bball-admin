import { describe, expect, it } from "vitest";
import { buildSeasonCalendar } from "@/models/buildSeasonCalendar";
import { compareGamesByDate } from "@/models/compareGamesByDate";
import { countDaysUntil } from "@/models/countDaysUntil";
import { describeCalendarGame } from "@/models/describeCalendarGame";
import { describeDaysUntil } from "@/models/describeDaysUntil";
import { getGameStatus } from "@/models/getGameStatus";
import { getParisIsoDate } from "@/models/getParisIsoDate";
import { resolveRpbSide } from "@/models/resolveRpbSide";
import type { RpbTeam } from "@/models/RpbTeam";
import { toCalendarGame } from "@/models/toCalendarGame";
import { makeGame } from "./factories";

const TODAY = "2026-02-15";
const RPB: RpbTeam = { id: 1, name: "RPB" };

describe("getParisIsoDate", () => {
  it("passe au lendemain à Paris l'été dès 22 h UTC", () => {
    expect(getParisIsoDate(new Date("2026-07-14T23:30:00Z"))).toBe("2026-07-15");
  });

  it("reste le même jour l'hiver à 22 h 30 UTC", () => {
    expect(getParisIsoDate(new Date("2026-01-14T22:30:00Z"))).toBe("2026-01-14");
  });

  it("gère le passage à l'heure d'été", () => {
    expect(getParisIsoDate(new Date("2026-03-29T00:30:00Z"))).toBe("2026-03-29");
    expect(getParisIsoDate(new Date("2026-03-28T22:59:00Z"))).toBe("2026-03-28");
  });
});

describe("getGameStatus", () => {
  it("0-0 dans le futur ou le jour même : à venir", () => {
    expect(getGameStatus(makeGame(0, 0, "RPB", "OTB", { date: "2026-02-20" }), TODAY)).toBe("upcoming");
    expect(getGameStatus(makeGame(0, 0, "RPB", "OTB", { date: TODAY }), TODAY)).toBe("upcoming");
  });

  it("0-0 dans le passé : score à saisir", () => {
    expect(getGameStatus(makeGame(0, 0, "RPB", "OTB", { date: "2026-02-14" }), TODAY)).toBe("scoreMissing");
  });

  it("un score saisi fait foi, quelle que soit la date", () => {
    expect(getGameStatus(makeGame(78, 65, "RPB", "OTB", { date: "2026-01-10" }), TODAY)).toBe("played");
    expect(getGameStatus(makeGame(78, 65, "RPB", "OTB", { date: "2026-03-10" }), TODAY)).toBe("played");
    expect(getGameStatus(makeGame(0, 5, "RPB", "OTB", { date: "2026-01-10" }), TODAY)).toBe("played");
  });
});

describe("countDaysUntil / describeDaysUntil", () => {
  it("compte les jours calendaires", () => {
    expect(countDaysUntil(TODAY, TODAY)).toBe(0);
    expect(countDaysUntil("2026-02-16", TODAY)).toBe(1);
    expect(countDaysUntil("2026-02-22", TODAY)).toBe(7);
    expect(countDaysUntil("2026-02-14", TODAY)).toBe(-1);
  });

  it("traverse le passage à l'heure d'été, les mois et les années", () => {
    expect(countDaysUntil("2026-03-30", "2026-03-28")).toBe(2);
    expect(countDaysUntil("2026-03-01", "2026-02-28")).toBe(1);
    expect(countDaysUntil("2027-01-02", "2026-12-31")).toBe(2);
  });

  it("décrit le délai", () => {
    expect(describeDaysUntil(0)).toBe("Aujourd'hui");
    expect(describeDaysUntil(1)).toBe("Demain");
    expect(describeDaysUntil(7)).toBe("Dans 7 jours");
    expect(describeDaysUntil(-1)).toBe("");
  });
});

describe("resolveRpbSide", () => {
  it("renvoie null sans équipe RPB", () => {
    expect(resolveRpbSide(makeGame(1, 0, "RPB", "OTB"), null)).toBeNull();
  });

  it("compare les identifiants quand les deux sont connus", () => {
    expect(resolveRpbSide(makeGame(1, 0, "X", "Y", { homeTeamId: 1, awayTeamId: 2 }), RPB)).toBe("home");
    expect(resolveRpbSide(makeGame(1, 0, "X", "Y", { homeTeamId: 2, awayTeamId: 1 }), RPB)).toBe("away");
  });

  it("ne se rabat pas sur le nom quand les identifiants ne correspondent pas", () => {
    expect(resolveRpbSide(makeGame(1, 0, "RPB", "OTB", { homeTeamId: 5, awayTeamId: 6 }), RPB)).toBeNull();
  });

  it("se rabat sur le nom sans identifiants (casse, espaces)", () => {
    expect(resolveRpbSide(makeGame(1, 0, "OTB", " rpb "), RPB)).toBe("away");
  });

  it("homonymes des deux côtés : domicile (limite documentée)", () => {
    expect(resolveRpbSide(makeGame(1, 0, "RPB", "RPB"), RPB)).toBe("home");
  });
});

describe("compareGamesByDate", () => {
  it("trie par date, puis journée, puis identifiant", () => {
    const a = makeGame(0, 0, "A", "B", { id: 1, number: 2, date: "2026-01-10" });
    const b = makeGame(0, 0, "A", "B", { id: 2, number: 1, date: "2026-01-17" });
    const c = makeGame(0, 0, "A", "B", { id: 3, number: 1, date: "2026-01-10" });
    const d = makeGame(0, 0, "A", "B", { id: 4, number: 1, date: "2026-01-10" });
    expect([a, b, d, c].sort(compareGamesByDate).map((g) => g.id)).toEqual([3, 4, 1, 2]);
  });
});

describe("toCalendarGame", () => {
  it("combine statut, côté et résultat", () => {
    expect(toCalendarGame(makeGame(50, 60, "OTB", "RPB"), RPB, TODAY)).toMatchObject({
      status: "played",
      rpbSide: "away",
      outcome: "win",
    });
    expect(toCalendarGame(makeGame(0, 0, "RPB", "OTB", { date: "2026-03-01" }), RPB, TODAY)).toMatchObject({
      status: "upcoming",
      rpbSide: "home",
      outcome: "notEntered",
    });
  });
});

describe("buildSeasonCalendar", () => {
  it("liste vide", () => {
    expect(buildSeasonCalendar([], RPB, TODAY)).toEqual({ next: null, upcoming: [], results: [] });
  });

  it("début de saison : que des matchs à venir", () => {
    const games = [
      makeGame(0, 0, "RPB", "B", { id: 2, date: "2026-03-01" }),
      makeGame(0, 0, "RPB", "A", { id: 1, date: "2026-02-20" }),
    ];
    const calendar = buildSeasonCalendar(games, RPB, TODAY);
    expect(calendar.next?.game.id).toBe(1);
    expect(calendar.upcoming.map((e) => e.game.id)).toEqual([2]);
    expect(calendar.results).toEqual([]);
  });

  it("fin de saison : pas de prochain match, résultats du plus récent au plus ancien", () => {
    const games = [
      makeGame(70, 60, "RPB", "A", { id: 1, date: "2026-01-10" }),
      makeGame(0, 0, "RPB", "B", { id: 2, date: "2026-02-01" }),
      makeGame(50, 60, "RPB", "C", { id: 3, date: "2026-01-20" }),
    ];
    const calendar = buildSeasonCalendar(games, RPB, TODAY);
    expect(calendar.next).toBeNull();
    expect(calendar.upcoming).toEqual([]);
    expect(calendar.results.map((e) => [e.game.id, e.status])).toEqual([
      [2, "scoreMissing"],
      [3, "played"],
      [1, "played"],
    ]);
  });

  it("ne modifie pas la liste reçue", () => {
    const games = [
      makeGame(0, 0, "RPB", "B", { id: 2, date: "2026-03-01" }),
      makeGame(0, 0, "RPB", "A", { id: 1, date: "2026-02-20" }),
    ];
    const snapshot = structuredClone(games);
    buildSeasonCalendar(games, RPB, TODAY);
    expect(games).toEqual(snapshot);
  });
});

describe("describeCalendarGame", () => {
  const entry = (...args: Parameters<typeof makeGame>) => toCalendarGame(makeGame(...args), RPB, TODAY);

  it("victoire à domicile", () => {
    expect(describeCalendarGame(entry(78, 65, "RPB", "OTB", { number: 5, date: "2026-01-10" }))).toBe(
      "RPB contre OTB, journée 5, samedi 10 janvier 2026, victoire 78 à 65",
    );
  });

  it("défaite à l'extérieur : score du RPB d'abord", () => {
    expect(describeCalendarGame(entry(70, 60, "OTB", "RPB", { number: 6, date: "2026-01-17" }))).toBe(
      "RPB contre OTB, journée 6, samedi 17 janvier 2026, défaite 60 à 70",
    );
  });

  it("match nul", () => {
    expect(describeCalendarGame(entry(70, 70, "RPB", "OTB", { number: 7, date: "2026-01-24" }))).toBe(
      "RPB contre OTB, journée 7, samedi 24 janvier 2026, match nul 70 à 70",
    );
  });

  it("à venir, avec le lieu", () => {
    expect(describeCalendarGame(entry(0, 0, "UBV", "RPB", { number: 12, date: "2026-02-21" }))).toBe(
      "RPB contre UBV, journée 12, samedi 21 février 2026, à venir, à l'extérieur",
    );
    expect(describeCalendarGame(entry(0, 0, "RPB", "UBV", { number: 12, date: "2026-02-21" }))).toBe(
      "RPB contre UBV, journée 12, samedi 21 février 2026, à venir, à domicile",
    );
  });

  it("score à saisir", () => {
    expect(describeCalendarGame(entry(0, 0, "RPB", "OTB", { number: 8, date: "2026-02-07" }))).toBe(
      "RPB contre OTB, journée 8, samedi 7 février 2026, score à saisir",
    );
  });

  it("côté inconnu : ordre domicile / extérieur, sans résultat", () => {
    expect(describeCalendarGame(entry(70, 64, "A", "B", { number: 3, date: "2026-01-03" }))).toBe(
      "A contre B, journée 3, samedi 3 janvier 2026, 70 à 64",
    );
  });
});
