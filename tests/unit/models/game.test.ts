import { describe, expect, it } from "vitest";
import { getGameOutcome } from "@/models/getGameOutcome";
import { getRpbSide } from "@/models/getRpbSide";
import { isToday } from "@/models/isToday";
import { makeGame } from "./factories";

describe("getRpbSide", () => {
  it("trouve le RPB à domicile ou à l'extérieur", () => {
    expect(getRpbSide(makeGame(1, 0, "RPB", "OTB"), "RPB")).toBe("home");
    expect(getRpbSide(makeGame(1, 0, "OTB", "RPB"), "RPB")).toBe("away");
  });

  it("ignore la casse et les espaces de bord", () => {
    expect(getRpbSide(makeGame(1, 0, " FAC Basket ", "OTB"), "fac basket")).toBe("home");
  });

  it("renvoie null si aucun côté ne correspond ou si le nom est inconnu", () => {
    expect(getRpbSide(makeGame(1, 0, "A", "B"), "RPB")).toBeNull();
    expect(getRpbSide(makeGame(1, 0, "RPB", "B"), null)).toBeNull();
  });
});

describe("getGameOutcome", () => {
  it("victoire et défaite à domicile", () => {
    expect(getGameOutcome(makeGame(78, 71), "home")).toBe("win");
    expect(getGameOutcome(makeGame(60, 71), "home")).toBe("loss");
  });

  it("victoire et défaite à l'extérieur", () => {
    expect(getGameOutcome(makeGame(16, 48), "away")).toBe("win");
    expect(getGameOutcome(makeGame(72, 69), "away")).toBe("loss");
  });

  it("0-0 est un score non saisi", () => {
    expect(getGameOutcome(makeGame(0, 0), "home")).toBe("notEntered");
    expect(getGameOutcome(makeGame(0, 0), null)).toBe("notEntered");
  });

  it("une égalité non nulle est un nul", () => {
    expect(getGameOutcome(makeGame(50, 50), "away")).toBe("draw");
  });

  it("un côté inconnu donne unknown", () => {
    expect(getGameOutcome(makeGame(78, 71), null)).toBe("unknown");
  });
});

describe("isToday", () => {
  it("bascule à minuit heure de Paris (heure d'été)", () => {
    expect(isToday("2026-10-05", new Date("2026-10-04T22:30:00Z"))).toBe(true);
    expect(isToday("2026-10-04", new Date("2026-10-04T22:30:00Z"))).toBe(false);
  });

  it("bascule à minuit heure de Paris (heure d'hiver)", () => {
    expect(isToday("2027-01-01", new Date("2026-12-31T23:30:00Z"))).toBe(true);
  });

  it("gère la journée du changement d'heure", () => {
    expect(isToday("2026-03-29", new Date("2026-03-28T23:30:00Z"))).toBe(true);
    expect(isToday("2026-03-29", new Date("2026-03-29T21:59:00Z"))).toBe(true);
    expect(isToday("2026-03-29", new Date("2026-03-29T22:00:00Z"))).toBe(false);
  });

  it("la veille et le lendemain ne sont pas aujourd'hui", () => {
    const now = new Date("2026-02-21T12:00:00Z");
    expect(isToday("2026-02-20", now)).toBe(false);
    expect(isToday("2026-02-22", now)).toBe(false);
  });
});
