import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import type { Session } from "@/models/Session";
import { listAccessibleSeasons } from "@/repositories/SeasonRepository";
import { loadFixture, stubApi } from "../helpers";

const admin: Session = { username: "admin", licence: null, role: "admin", token: "tok" };
const player: Session = { username: "lucas", licence: "LIC1000", role: "player", token: "tok" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SeasonRepository.listAccessibleSeasons", () => {
  it("un admin voit toutes les saisons", async () => {
    const calls = stubApi({ "/api/saisons": loadFixture("saisons-admin.json") });
    const seasons = await listAccessibleSeasons(admin);
    expect(calls.map((c) => c.path)).toEqual(["/api/saisons"]);
    expect(seasons[0]).toEqual({
      id: 4,
      startYear: 2025,
      endYear: 2026,
      championship: "D1",
      category: "U15G",
      teamId: 1,
    });
  });

  it("un joueur ne voit que ses saisons", async () => {
    const calls = stubApi({ "/saisons/LIC1000": loadFixture("saisons-joueur.json") });
    await expect(listAccessibleSeasons(player)).resolves.toHaveLength(2);
    expect(calls.map((c) => c.path)).toEqual(["/saisons/LIC1000"]);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("un compte sans joueur ne voit aucune saison, sans appel réseau (D7)", async () => {
    const calls = stubApi({ "/api/saisons": loadFixture("saisons-admin.json") });
    const orphan: Session = { username: "jean.dupont", licence: null, role: "player", token: "tok" };
    await expect(listAccessibleSeasons(orphan)).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("rejette une réponse qui n'est pas un tableau", async () => {
    stubApi({ "/api/saisons": { saisons: loadFixture("saisons-admin.json") } });
    await expect(listAccessibleSeasons(admin)).rejects.toBeInstanceOf(ZodError);
  });
});
