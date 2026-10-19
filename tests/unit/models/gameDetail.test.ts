import { describe, expect, it } from "vitest";
import { describeGameVideo } from "@/models/describeGameVideo";
import { findAccessibleSeason } from "@/models/findAccessibleSeason";
import { formatGameHeading } from "@/models/formatGameHeading";
import { getRpbSideById } from "@/models/getRpbSideById";
import { parseGameId } from "@/models/parseGameId";
import { parseGameVideo } from "@/models/parseGameVideo";
import { toGameOverview } from "@/models/toGameOverview";
import { makeGame, makeSeason } from "./factories";

const ID = "t8QR6Oq4i5s";
const TODAY = "2026-02-15";

describe("parseGameId", () => {
  it("accepte un entier positif", () => {
    expect(parseGameId("12")).toBe(12);
    expect(parseGameId("2147483647")).toBe(2147483647);
  });

  it.each(["abc", "12abc", "0", "-3", "1.5", " 12", "", "99999999999", "2147483648", "012"])("rejette %j", (raw) => {
    expect(parseGameId(raw)).toBeNull();
  });
});

describe("parseGameVideo", () => {
  it("vide → none", () => {
    expect(parseGameVideo(null)).toEqual({ kind: "none" });
    expect(parseGameVideo("")).toEqual({ kind: "none" });
    expect(parseGameVideo("   ")).toEqual({ kind: "none" });
  });

  it.each([
    ID,
    ` ${ID} `,
    `https://www.youtube.com/watch?v=${ID}&t=30s`,
    `youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=x`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
  ])("reconnaît %s", (raw) => {
    expect(parseGameVideo(raw)).toEqual({ kind: "youtube", videoId: ID });
  });

  it.each([
    "https://vimeo.com/123456",
    "abcdefghij",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=abc",
    "pas une vidéo",
  ])("signale %s comme invalide", (raw) => {
    expect(parseGameVideo(raw)).toEqual({ kind: "invalid", raw });
  });
});

describe("getRpbSideById / toGameOverview", () => {
  const game = makeGame(54, 49, "OTB", "FAC Basket", { homeTeamId: 12, awayTeamId: 1 });

  it("résout le côté par identifiant", () => {
    expect(getRpbSideById(game, 1)).toBe("away");
    expect(getRpbSideById(game, 12)).toBe("home");
    expect(getRpbSideById(game, 99)).toBeNull();
    expect(getRpbSideById(game, null)).toBeNull();
    expect(getRpbSideById(makeGame(1, 0, "RPB", "B", { homeTeamId: null, awayTeamId: 2 }), 1)).toBeNull();
  });

  it("combine statut et résultat", () => {
    expect(toGameOverview(game, 1, TODAY)).toMatchObject({ status: "played", rpbSide: "away", outcome: "loss" });
    expect(toGameOverview(game, 12, TODAY)).toMatchObject({ outcome: "win" });
    expect(toGameOverview(makeGame(50, 50, "A", "B", { homeTeamId: 1, awayTeamId: 2 }), 1, TODAY).outcome).toBe("draw");
    const future = makeGame(0, 0, "A", "B", { homeTeamId: 1, awayTeamId: 2, date: "2026-03-01" });
    expect(toGameOverview(future, 1, TODAY).status).toBe("upcoming");
    const past = makeGame(0, 0, "A", "B", { homeTeamId: 1, awayTeamId: 2, date: "2026-02-01" });
    expect(toGameOverview(past, 1, TODAY)).toMatchObject({ status: "scoreMissing", outcome: "notEntered" });
    expect(toGameOverview(game, null, TODAY)).toMatchObject({ rpbSide: null, outcome: "unknown" });
  });
});

describe("findAccessibleSeason", () => {
  it("trouve la saison du match parmi les saisons accessibles", () => {
    const seasons = [makeSeason({ id: 4 }), makeSeason({ id: 1 })];
    expect(findAccessibleSeason(seasons, 1)?.id).toBe(1);
    expect(findAccessibleSeason(seasons, 3)).toBeNull();
  });
});

describe("describeGameVideo / formatGameHeading", () => {
  const game = makeGame(54, 49, "OTB", "FAC Basket", { number: 9 });
  const overview = (rpbSide: "home" | "away" | null) => ({ game, status: "played" as const, rpbSide, outcome: "loss" as const });

  it("met le RPB en premier quand son côté est connu", () => {
    expect(describeGameVideo(overview("away"))).toBe("Vidéo du match FAC Basket contre OTB, journée 9");
    expect(describeGameVideo(overview("home"))).toBe("Vidéo du match OTB contre FAC Basket, journée 9");
    expect(describeGameVideo(overview(null))).toBe("Vidéo du match OTB contre FAC Basket, journée 9");
  });

  it("titre de page : domicile – extérieur", () => {
    expect(formatGameHeading(game)).toBe("Journée 9 : OTB – FAC Basket");
  });
});
