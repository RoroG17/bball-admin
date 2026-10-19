import { describe, expect, it } from "vitest";
import { formatPlayerName } from "@/models/formatPlayerName";
import { getPlayerInitials } from "@/models/getPlayerInitials";
import { getTeamInitials } from "@/models/getTeamInitials";
import { sortPlayersByName } from "@/models/sortPlayersByName";

describe("getPlayerInitials", () => {
  it("prend l'initiale du prénom et du nom", () => {
    expect(getPlayerInitials({ firstName: "Jean", lastName: "Dupont" })).toBe("JD");
  });

  it("gère les prénoms composés et la casse", () => {
    expect(getPlayerInitials({ firstName: "jean-marc", lastName: "dupont" })).toBe("JD");
  });

  it("gère les chaînes vides", () => {
    expect(getPlayerInitials({ firstName: "", lastName: "Dupont" })).toBe("D");
    expect(getPlayerInitials({ firstName: " ", lastName: "" })).toBe("?");
  });
});

describe("formatPlayerName", () => {
  it("affiche « Prénom Nom »", () => {
    expect(formatPlayerName({ firstName: "Lucas", lastName: "MARTIN" })).toBe("Lucas MARTIN");
  });
});

describe("sortPlayersByName", () => {
  it("trie les accents comme des lettres simples", () => {
    const sorted = sortPlayersByName([
      { firstName: "A", lastName: "Fournier" },
      { firstName: "B", lastName: "Éric" },
      { firstName: "C", lastName: "Dupont" },
    ]);
    expect(sorted.map((p) => p.lastName)).toEqual(["Dupont", "Éric", "Fournier"]);
  });

  it("départage les homonymes par le prénom", () => {
    const sorted = sortPlayersByName([
      { firstName: "Tom", lastName: "Martin" },
      { firstName: "Hugo", lastName: "MARTIN" },
    ]);
    expect(sorted.map((p) => p.firstName)).toEqual(["Hugo", "Tom"]);
  });
});

describe("getTeamInitials", () => {
  it("prend l'initiale de chaque mot", () => {
    expect(getTeamInitials("Union Basket Vallon")).toBe("UBV");
  });

  it("garde les sigles", () => {
    expect(getTeamInitials("FAC Basket")).toBe("FAC");
    expect(getTeamInitials("JS Cugnaux")).toBe("JSC");
    expect(getTeamInitials("RPB")).toBe("RPB");
  });

  it("ignore les mots de liaison et les tirets", () => {
    expect(getTeamInitials("Étoile de Saint-Jean")).toBe("ÉSJ");
  });

  it("prend 3 lettres d'un mot seul", () => {
    expect(getTeamInitials("Toulouse")).toBe("TOU");
    expect(getTeamInitials("  ")).toBe("?");
  });
});
