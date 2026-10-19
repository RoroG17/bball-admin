import { describe, expect, it } from "vitest";
import { hasLinkedPlayer } from "@/models/hasLinkedPlayer";
import { hasPermission } from "@/models/hasPermission";
import { ROLE_PERMISSIONS } from "@/models/Permission";
import { resolveUserRole } from "@/models/resolveUserRole";

describe("resolveUserRole (D1 : fermé par défaut)", () => {
  it("le compte admin sans licence est admin", () => {
    expect(resolveUserRole({ username: "admin", licence: null })).toBe("admin");
  });

  it("égalité stricte : casse, espaces et caractères ambigus donnent un joueur", () => {
    for (const username of ["Admin", "ADMIN", "admin ", " admin", "admin​", "ａｄｍｉｎ", "аdmin"]) {
      expect(resolveUserRole({ username, licence: null })).toBe("player");
    }
  });

  it("le compte admin avec une licence est joueur", () => {
    expect(resolveUserRole({ username: "admin", licence: "LIC1000" })).toBe("player");
  });

  it("un compte sans licence qui n'est pas admin est joueur", () => {
    expect(resolveUserRole({ username: "jean.dupont", licence: null })).toBe("player");
    expect(resolveUserRole({ username: "coach", licence: null })).toBe("player");
  });

  it("un utilisateur avec une licence est joueur", () => {
    expect(resolveUserRole({ username: "lucas", licence: "LIC1000" })).toBe("player");
  });
});

describe("hasPermission", () => {
  it("l'admin a toutes les permissions", () => {
    for (const permission of ["accessAdmin", "editStats", "managePlayerData", "viewAllSeasons"] as const) {
      expect(hasPermission({ role: "admin" }, permission)).toBe(true);
    }
  });

  it("accessAdmin est réservée à l'admin", () => {
    expect(hasPermission({ role: "player" }, "accessAdmin")).toBe(false);
    expect(hasPermission(null, "accessAdmin")).toBe(false);
    expect(ROLE_PERMISSIONS.admin).toEqual(["accessAdmin", "editStats", "managePlayerData", "viewAllSeasons"]);
  });

  it("le joueur n'en a aucune", () => {
    expect(hasPermission({ role: "player" }, "accessAdmin")).toBe(false);
    expect(hasPermission({ role: "player" }, "viewAllSeasons")).toBe(false);
  });

  it("sans session, rien n'est permis", () => {
    expect(hasPermission(null, "editStats")).toBe(false);
  });
});

describe("hasLinkedPlayer", () => {
  it("l'admin n'a pas besoin de joueur", () => {
    expect(hasLinkedPlayer({ role: "admin", licence: null })).toBe(true);
  });

  it("un joueur avec licence est rattaché", () => {
    expect(hasLinkedPlayer({ role: "player", licence: "LIC1000" })).toBe(true);
  });

  it("un joueur sans licence ne l'est pas", () => {
    expect(hasLinkedPlayer({ role: "player", licence: null })).toBe(false);
  });
});
