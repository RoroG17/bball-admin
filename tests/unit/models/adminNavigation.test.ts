import { describe, expect, it } from "vitest";
import { ADMIN_ENTITY_NOUNS, ADMIN_SECTIONS } from "@/models/AdminEntity";
import { buildAdminHref } from "@/models/buildAdminHref";

describe("ADMIN_SECTIONS", () => {
  it("garde l'ordre fixe de la navigation, avec libellé et description", () => {
    expect(ADMIN_SECTIONS.map((s) => s.entity)).toEqual(["player", "team", "season", "game", "user", "logs"]);
    expect(ADMIN_SECTIONS.map((s) => s.label)).toEqual([
      "Joueurs",
      "Équipes",
      "Saisons",
      "Matchs",
      "Utilisateurs",
      "Journaux",
    ]);
    for (const section of ADMIN_SECTIONS) expect(section.description.length).toBeGreaterThan(10);
  });

  it("donne un nom et un genre à chaque entité", () => {
    expect(ADMIN_ENTITY_NOUNS.player).toEqual({ singular: "joueur", gender: "m" });
    expect(ADMIN_ENTITY_NOUNS.team).toEqual({ singular: "équipe", gender: "f" });
    expect(ADMIN_ENTITY_NOUNS.season).toEqual({ singular: "saison", gender: "f" });
    expect(ADMIN_ENTITY_NOUNS.game).toEqual({ singular: "match", gender: "m" });
    expect(ADMIN_ENTITY_NOUNS.user).toEqual({ singular: "compte", gender: "m" });
    expect(ADMIN_ENTITY_NOUNS.logs).toEqual({ singular: "journal", gender: "m" });
  });
});

describe("buildAdminHref", () => {
  it("construit la liste (défaut) et la création", () => {
    expect(buildAdminHref("player")).toBe("/admin/player");
    expect(buildAdminHref("team", "list")).toBe("/admin/team");
    expect(buildAdminHref("season", "create")).toBe("/admin/season/create");
    expect(buildAdminHref("logs")).toBe("/admin/logs");
  });

  it("construit edit / delete / reset avec l'identifiant", () => {
    expect(buildAdminHref("player", { kind: "edit", id: "LIC1000" })).toBe("/admin/player/LIC1000/edit");
    expect(buildAdminHref("game", { kind: "delete", id: 12 })).toBe("/admin/game/12/delete");
    expect(buildAdminHref("user", { kind: "reset", id: "lucas.marchand" })).toBe("/admin/user/lucas.marchand/reset");
  });

  it("encode l'identifiant (espace, barre, point, accent)", () => {
    expect(buildAdminHref("user", { kind: "edit", id: "a b" })).toBe("/admin/user/a%20b/edit");
    expect(buildAdminHref("user", { kind: "edit", id: "a/b" })).toBe("/admin/user/a%2Fb/edit");
    expect(buildAdminHref("user", { kind: "edit", id: "é" })).toBe("/admin/user/%C3%A9/edit");
    expect(buildAdminHref("user", { kind: "edit", id: "a.b" })).toBe("/admin/user/a.b/edit");
  });

  it("refuse create / edit / delete / reset pour les journaux", () => {
    expect(() => buildAdminHref("logs", "create")).toThrow();
    expect(() => buildAdminHref("logs", { kind: "edit", id: 1 })).toThrow();
  });
});
