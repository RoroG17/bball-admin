import { describe, expect, it } from "vitest";
import { appendAdminNotice } from "@/models/appendAdminNotice";
import { buildAdminNoticeHref } from "@/models/buildAdminNoticeHref";
import { describeAdminNotice } from "@/models/describeAdminNotice";
import { parseAdminNotice } from "@/models/parseAdminNotice";

describe("parseAdminNotice", () => {
  it("lit un code valide avec ou sans ref", () => {
    expect(parseAdminNotice({ notice: "created", ref: "LIC1000" })).toEqual({ code: "created", ref: "LIC1000" });
    expect(parseAdminNotice({ notice: "deleted" })).toEqual({ code: "deleted", ref: null });
  });

  it("code inconnu ou absent → null", () => {
    expect(parseAdminNotice({ notice: "hacked" })).toBeNull();
    expect(parseAdminNotice({})).toBeNull();
    expect(parseAdminNotice({ notice: "" })).toBeNull();
  });

  it("prend le premier élément d'un tableau", () => {
    expect(parseAdminNotice({ notice: ["updated", "deleted"], ref: ["1", "2"] })).toEqual({ code: "updated", ref: "1" });
  });

  it("tronque la ref à 64 caractères et ignore une ref vide", () => {
    expect(parseAdminNotice({ notice: "created", ref: "x".repeat(100) })?.ref).toHaveLength(64);
    expect(parseAdminNotice({ notice: "created", ref: "" })?.ref).toBeNull();
  });
});

describe("appendAdminNotice (C8 : notice et ref en dernier)", () => {
  it("ajoute en fin d'une URL sans paramètre", () => {
    expect(appendAdminNotice("/admin/team", { code: "deleted" })).toBe("/admin/team?notice=deleted");
  });

  it("ajoute après les paramètres existants, ref comprise et encodée", () => {
    expect(appendAdminNotice("/admin/game?saison=4&page=2", { code: "created", ref: "a b" })).toBe(
      "/admin/game?saison=4&page=2&notice=created&ref=a%20b",
    );
  });

  it("n'ajoute la ref que pour created et updated", () => {
    expect(appendAdminNotice("/admin/team", { code: "deleted", ref: 3 })).toBe("/admin/team?notice=deleted");
    expect(appendAdminNotice("/admin/team", { code: "reset", ref: 3 })).toBe("/admin/team?notice=reset");
    expect(appendAdminNotice("/admin/team", { code: "updated", ref: 3 })).toBe("/admin/team?notice=updated&ref=3");
  });

  it("n'ajoute pas de ref vide ou nulle", () => {
    expect(appendAdminNotice("/admin/team", { code: "created", ref: "" })).toBe("/admin/team?notice=created");
    expect(appendAdminNotice("/admin/team", { code: "created", ref: null })).toBe("/admin/team?notice=created");
  });

  it("ne duplique pas une notice déjà présente (elle repasse en dernier)", () => {
    expect(appendAdminNotice("/admin/team?notice=created&ref=1&q=a", { code: "deleted" })).toBe(
      "/admin/team?q=a&notice=deleted",
    );
  });

  it("conserve le fragment à la fin", () => {
    expect(appendAdminNotice("/admin/team?q=a#liste", { code: "updated", ref: 2 })).toBe(
      "/admin/team?q=a&notice=updated&ref=2#liste",
    );
  });
});

describe("buildAdminNoticeHref", () => {
  it("construit la liste de l'entité avec la notice", () => {
    expect(buildAdminNoticeHref("player", { code: "created", ref: "LIC1000" })).toBe(
      "/admin/player?notice=created&ref=LIC1000",
    );
    expect(buildAdminNoticeHref("team", { code: "deleted" })).toBe("/admin/team?notice=deleted");
    expect(buildAdminNoticeHref("user", { code: "reset" })).toBe("/admin/user?notice=reset");
  });
});

describe("describeAdminNotice", () => {
  it("accorde créé / modifié au genre", () => {
    expect(describeAdminNotice("created", "player", "Lucas Marchand")).toBe("Joueur « Lucas Marchand » créé.");
    expect(describeAdminNotice("created", "team", "Colomiers")).toBe("Équipe « Colomiers » créée.");
    expect(describeAdminNotice("updated", "season", "2025-2026")).toBe("Saison « 2025-2026 » modifiée.");
    expect(describeAdminNotice("updated", "game", "RPB - OTB")).toBe("Match « RPB - OTB » modifié.");
  });

  it("sans libellé", () => {
    expect(describeAdminNotice("created", "player", null)).toBe("Joueur créé.");
    expect(describeAdminNotice("created", "team", "  ")).toBe("Équipe créée.");
    expect(describeAdminNotice("updated", "season", null)).toBe("Saison modifiée.");
  });

  it("deleted n'affiche jamais le libellé", () => {
    expect(describeAdminNotice("deleted", "team", "Colomiers")).toBe("Équipe supprimée.");
    expect(describeAdminNotice("deleted", "player", null)).toBe("Joueur supprimé.");
  });

  it("reset", () => {
    expect(describeAdminNotice("reset", "user", null)).toBe("Mot de passe réinitialisé.");
  });
});
