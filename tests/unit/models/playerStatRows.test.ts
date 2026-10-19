import { describe, expect, it } from "vitest";
import { buildPlayerStatRows } from "@/models/buildPlayerStatRows";
import { findDuplicatePlayers } from "@/models/findDuplicatePlayers";
import type { PlayerStatSortKey } from "@/models/playerStatColumns";
import { sortPlayerStatRows } from "@/models/sortPlayerStatRows";
import { makePlayerGameStats } from "./gameDetailFactories";

const martin = makePlayerGameStats({
  lineId: 1,
  licence: "L1",
  lastName: "MARTIN",
  firstName: "Lucas",
  playingTimeSeconds: 900,
  periods: [{ period: 1, twoPoints: { made: 3, missed: 1 } }, { period: 3, assists: 2 }],
});
const bernard = makePlayerGameStats({
  lineId: 2,
  licence: "L2",
  lastName: "BERNARD",
  firstName: "Hugo",
  playingTimeSeconds: null,
  periods: [{ period: 1, twoPoints: { made: 3, missed: 4 } }, { period: 2, threePoints: { made: 1 } }],
});
const dubois = makePlayerGameStats({
  lineId: 3,
  licence: "L3",
  lastName: "DUBOIS",
  firstName: "Nathan",
  playingTimeSeconds: 1200,
  periods: [{ period: 1, freeThrows: { made: 2 } }],
});

describe("findDuplicatePlayers", () => {
  it("aucun doublon", () => {
    expect(findDuplicatePlayers([martin, bernard])).toEqual([]);
  });

  it("regroupe par licence et trie par nom", () => {
    const lines = [martin, { ...martin, lineId: 9 }, bernard, { ...bernard, lineId: 8 }, { ...bernard, lineId: 7 }];
    expect(findDuplicatePlayers(lines)).toEqual([
      { licence: "L2", name: "Hugo BERNARD", lineCount: 3 },
      { licence: "L1", name: "Lucas MARTIN", lineCount: 2 },
    ]);
  });
});

describe("buildPlayerStatRows", () => {
  it("marque ma ligne et les doublons, sur la période choisie, dans l'ordre d'entrée", () => {
    const lines = [martin, bernard, { ...martin, lineId: 9 }];
    const rows = buildPlayerStatRows(lines, 3, { currentLicence: "L1", duplicateLicences: ["L1"] });
    expect(rows.map((row) => [row.lineId, row.isCurrentUser, row.isDuplicate, row.totals.assists])).toEqual([
      [1, true, true, 2],
      [2, false, false, 0],
      [9, true, true, 2],
    ]);
    expect(buildPlayerStatRows([martin], "all", { currentLicence: null, duplicateLicences: [] })[0].isCurrentUser).toBe(false);
  });
});

describe("sortPlayerStatRows", () => {
  const rows = buildPlayerStatRows([martin, bernard, dubois], "all", { currentLicence: null, duplicateLicences: [] });
  const order = (key: PlayerStatSortKey, direction: "asc" | "desc") =>
    sortPlayerStatRows(rows, key, direction).map((row) => row.player.licence);

  it("par nom", () => {
    expect(order("name", "asc")).toEqual(["L2", "L3", "L1"]);
    expect(order("name", "desc")).toEqual(["L1", "L3", "L2"]);
  });

  it("par points", () => {
    expect(order("points", "desc")).toEqual(["L2", "L1", "L3"]);
    expect(order("points", "asc")).toEqual(["L3", "L1", "L2"]);
  });

  it("minutes inconnues toujours en dernier", () => {
    expect(order("minutes", "desc")).toEqual(["L3", "L1", "L2"]);
    expect(order("minutes", "asc")).toEqual(["L1", "L3", "L2"]);
  });

  it("tirs : réussis puis tentés", () => {
    expect(order("twoPoints", "desc")).toEqual(["L2", "L1", "L3"]);
  });

  it("égalité : nom puis lineId", () => {
    expect(order("blocks", "desc")).toEqual(["L2", "L3", "L1"]);
    const twins = buildPlayerStatRows([{ ...martin, lineId: 5 }, martin], "all", { currentLicence: null, duplicateLicences: [] });
    expect(sortPlayerStatRows(twins, "points", "desc").map((row) => row.lineId)).toEqual([1, 5]);
  });

  it("ne mute pas l'entrée", () => {
    const before = rows.map((row) => row.lineId);
    sortPlayerStatRows(rows, "points", "desc");
    expect(rows.map((row) => row.lineId)).toEqual(before);
  });
});
