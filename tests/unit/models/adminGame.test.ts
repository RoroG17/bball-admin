import { describe, expect, it } from "vitest";
import type { CalendarGame } from "@/models/CalendarGame";
import { computeScoreGap } from "@/models/computeScoreGap";
import { describeAdminGameAlert } from "@/models/describeAdminGameAlert";
import { getAdminGameActions } from "@/models/getAdminGameActions";
import { getAdminGameAlerts } from "@/models/getAdminGameAlerts";
import { getStatsAvailability } from "@/models/getStatsAvailability";
import { makeGame } from "./factories";
import { makePlayerGameStats } from "./gameDetailFactories";

const overview = (overrides: Partial<CalendarGame> = {}): CalendarGame => ({
  game: makeGame(54, 49, "OTB", "FAC Basket"),
  status: "played",
  rpbSide: "away",
  outcome: "loss",
  ...overrides,
});

const NO_VIDEO = { kind: "none" } as const;
const VIDEO = { kind: "youtube", videoId: "t8QR6Oq4i5s" } as const;

describe("getStatsAvailability", () => {
  it("affiche les stats dès qu'il y a des lignes", () => {
    expect(getStatsAvailability("upcoming", 3)).toBe("available");
    expect(getStatsAvailability("played", 1)).toBe("available");
  });

  it("sinon distingue à venir et non saisi", () => {
    expect(getStatsAvailability("upcoming", 0)).toBe("upcoming");
    expect(getStatsAvailability("played", 0)).toBe("notEntered");
    expect(getStatsAvailability("scoreMissing", 0)).toBe("notEntered");
  });
});

describe("getAdminGameActions", () => {
  it("« Saisir les stats » seulement sans aucune ligne", () => {
    expect(getAdminGameActions({ statLineCount: 0, video: VIDEO })).toEqual(["enterStats", "editGame"]);
    expect(getAdminGameActions({ statLineCount: 5, video: VIDEO })).toEqual(["editGame"]);
    expect(getAdminGameActions({ statLineCount: null, video: VIDEO })).toEqual(["editGame"]);
  });

  it("« Ajouter la vidéo » sans vidéo valide", () => {
    expect(getAdminGameActions({ statLineCount: 0, video: NO_VIDEO })).toEqual(["enterStats", "editGame", "addVideo"]);
    expect(getAdminGameActions({ statLineCount: 1, video: { kind: "invalid", raw: "x" } })).toEqual(["editGame", "addVideo"]);
  });
});

describe("computeScoreGap", () => {
  it("compare le score du RPB à la somme des points", () => {
    expect(computeScoreGap(overview(), 46)).toEqual({ officialPoints: 49, statsPoints: 46, difference: 3 });
    expect(computeScoreGap(overview({ rpbSide: "home" }), 54)).toEqual({ officialPoints: 54, statsPoints: 54, difference: 0 });
  });

  it("null hors match joué ou côté inconnu", () => {
    expect(computeScoreGap(overview({ status: "upcoming" }), 0)).toBeNull();
    expect(computeScoreGap(overview({ rpbSide: null }), 0)).toBeNull();
  });
});

describe("getAdminGameAlerts / describeAdminGameAlert", () => {
  const line = makePlayerGameStats({ periods: [{ period: 1, twoPoints: { made: 20 } }, { period: 2, freeThrows: { made: 9 } }] });

  it("aucune alerte pour un match propre", () => {
    expect(getAdminGameAlerts({ overview: overview(), video: VIDEO, lines: [line], duplicates: [] })).toEqual([]);
  });

  it("toutes les alertes, dans l'ordre", () => {
    const duplicates = [{ licence: "L1", name: "Lucas MARTIN", lineCount: 2 }];
    const kinds = getAdminGameAlerts({
      overview: overview({ rpbSide: null }),
      video: { kind: "invalid", raw: "x" },
      lines: [line],
      duplicates,
    }).map((alert) => alert.kind);
    expect(kinds).toEqual(["duplicatePlayers", "invalidVideo", "rpbSideUnknown"]);

    const missing = getAdminGameAlerts({ overview: overview({ status: "scoreMissing" }), video: NO_VIDEO, lines: [], duplicates: [] });
    expect(missing.map((alert) => alert.kind)).toEqual(["scoreMissing", "statsMissing"]);
    expect(getAdminGameAlerts({ overview: overview({ status: "upcoming" }), video: NO_VIDEO, lines: [], duplicates: [] })).toEqual([]);

    const gap = getAdminGameAlerts({ overview: overview(), video: VIDEO, lines: [makePlayerGameStats()], duplicates: [] });
    expect(gap).toEqual([{ kind: "scoreGap", gap: { officialPoints: 49, statsPoints: 0, difference: 49 } }]);
  });

  it("textes", () => {
    expect(describeAdminGameAlert({ kind: "scoreMissing" })).toBe("Score à saisir : le match est passé mais le score vaut toujours 0-0.");
    expect(describeAdminGameAlert({ kind: "statsMissing" })).toBe("Statistiques non saisies pour ce match.");
    expect(
      describeAdminGameAlert({
        kind: "duplicatePlayers",
        players: [
          { licence: "L1", name: "Lucas MARTIN", lineCount: 2 },
          { licence: "L2", name: "Hugo BERNARD", lineCount: 3 },
        ],
      }),
    ).toBe(
      "Doublon : Lucas MARTIN apparaît 2 fois dans la feuille de stats ; Hugo BERNARD apparaît 3 fois dans la feuille de stats. Les totaux comptent toutes les lignes.",
    );
    expect(describeAdminGameAlert({ kind: "scoreGap", gap: { officialPoints: 50, statsPoints: 49, difference: 1 } })).toBe(
      "Écart entre le score officiel (50) et la somme des points saisis (49) : 1 point.",
    );
    expect(describeAdminGameAlert({ kind: "scoreGap", gap: { officialPoints: 46, statsPoints: 49, difference: -3 } })).toBe(
      "Écart entre le score officiel (46) et la somme des points saisis (49) : 3 points.",
    );
    expect(describeAdminGameAlert({ kind: "invalidVideo", raw: "pas une vidéo" })).toBe(
      "Lien vidéo non reconnu : « pas une vidéo ». Saisis l'identifiant YouTube ou une adresse youtube.com / youtu.be.",
    );
    expect(describeAdminGameAlert({ kind: "rpbSideUnknown" })).toContain("Aucune équipe RPB");
  });
});
