import { describe, expect, it } from "vitest";
import { ADMIN_REVALIDATION, SEASON_PARTICIPANT_REVALIDATION, type AdminWriteKind } from "@/models/adminRevalidation";

const KINDS: readonly AdminWriteKind[] = ["create", "update", "delete"];
const ENTITIES = ["player", "team", "season", "game", "user"] as const;

describe("ADMIN_REVALIDATION", () => {
  it("couvre chaque entité hors logs", () => {
    expect(Object.keys(ADMIN_REVALIDATION).sort()).toEqual([...ENTITIES].sort());
  });

  it.each(ENTITIES)("%s : chemins non vides, hallOfFameOn valide, motifs dynamiques typés", (entity) => {
    const { targets, hallOfFameOn } = ADMIN_REVALIDATION[entity];
    expect(targets.length).toBeGreaterThan(0);
    for (const kind of hallOfFameOn) expect(KINDS).toContain(kind);
    for (const target of targets) {
      if (typeof target === "string") expect(target).not.toContain("[");
      else {
        expect(target.pattern).toContain("[");
        expect(["page", "layout"]).toContain(target.type);
      }
    }
  });

  it("valeurs de la table fusionnée", () => {
    expect(ADMIN_REVALIDATION.player.targets).toContain("/admin/user");
    expect(ADMIN_REVALIDATION.team.targets).toContain("/admin/user");
    expect(ADMIN_REVALIDATION.player.hallOfFameOn).toEqual(["update", "delete"]);
    expect(ADMIN_REVALIDATION.team.hallOfFameOn).toEqual(["delete"]);
    expect(ADMIN_REVALIDATION.season.hallOfFameOn).toEqual(["delete"]);
    expect(ADMIN_REVALIDATION.game.hallOfFameOn).toEqual(["update", "delete"]);
    expect(ADMIN_REVALIDATION.user).toEqual({ targets: ["/admin/user", "/admin/user/create"], hallOfFameOn: [] });
  });
});

describe("SEASON_PARTICIPANT_REVALIDATION (C7)", () => {
  it("cible les pages qui affichent les participants, sans le palmarès", () => {
    expect(SEASON_PARTICIPANT_REVALIDATION).toEqual([
      { pattern: "/admin/season/[id]/edit", type: "page" },
      "/",
      "/game",
      "/player",
      { pattern: "/player/[licence]", type: "page" },
    ]);
  });
});
