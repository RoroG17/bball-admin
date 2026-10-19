import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import { loadFixture, stubApi } from "../helpers";

class NextControlError extends Error {}

const { getCurrentSession } = vi.hoisted(() => ({ getCurrentSession: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof NextControlError) throw error;
  },
}));
vi.mock("@/repositories/SessionRepository", () => ({ getCurrentSession }));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { createTeamRecord, deleteTeamRecord, getTeam, listTeams, updateTeamRecord } = await import(
  "@/repositories/TeamRepository"
);
const { listAccountLicences } = await import("@/repositories/UserRepository");
const { listGameTeamRefs } = await import("@/repositories/GameRepository");
const { readOrNull } = await import("@/repositories/support/readOrNull");

const equipes = loadFixture<Record<string, unknown>[]>("equipes.json", "admin-team");
const users = loadFixture("users.json", "admin-team");
const matchs = loadFixture<Record<string, unknown>[]>("matchs.json", "calendar");

afterEach(() => {
  vi.unstubAllGlobals();
  getCurrentSession.mockReset();
});

describe("TeamRepository.listTeams", () => {
  it("renvoie les équipes dans l'ordre du back, avec le nom du fichier et l'URL du logo", async () => {
    const calls = stubApi({ "/api/equipes": equipes });
    const teams = await listTeams("tok");
    expect(teams).toHaveLength(equipes.length);
    expect(teams[0]).toEqual({
      id: 1,
      name: "FAC Basket",
      logoFile: "logo_frouzins.png",
      logoUrl: "http://api.test/public/images/logo/logo_frouzins.png",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("logo null ou absent : ni fichier ni URL", async () => {
    stubApi({ "/api/equipes": [{ Id_Equipe: 1, nom: "A", logo: null }, { Id_Equipe: "2", nom: "B" }] });
    const teams = await listTeams("tok");
    expect(teams.map((team) => [team.id, team.logoFile, team.logoUrl])).toEqual([
      [1, null, null],
      [2, null, null],
    ]);
  });

  it("liste vide", async () => {
    stubApi({ "/api/equipes": [] });
    await expect(listTeams("tok")).resolves.toEqual([]);
  });

  it("un seul élément invalide fait échouer la lecture", async () => {
    stubApi({ "/api/equipes": [equipes[0], { Id_Equipe: 2 }] });
    await expect(listTeams("tok")).rejects.toBeInstanceOf(ZodError);
  });

  it("500 : lève", async () => {
    stubApi({ "/api/equipes": { status: 500, body: { message: "Server Error" } } });
    await expect(listTeams("tok")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("TeamRepository.getTeam", () => {
  it("200 : l'équipe", async () => {
    stubApi({ "/api/equipes/10": equipes[9] });
    await expect(getTeam(10, "tok")).resolves.toMatchObject({ id: 10, name: "US Colomiers" });
  });

  it("404 : null", async () => {
    stubApi({ "/api/equipes/999": { status: 404, body: loadFixture("equipe-404.json", "admin-team") } });
    await expect(getTeam(999, "tok")).resolves.toBeNull();
  });

  it("500 : lève, jamais null", async () => {
    stubApi({ "/api/equipes/10": { status: 500, body: {} } });
    await expect(getTeam(10, "tok")).rejects.toBeInstanceOf(ApiError);
  });

  it("format invalide : lève, jamais null", async () => {
    stubApi({ "/api/equipes/10": { nom: "sans identifiant" } });
    await expect(getTeam(10, "tok")).rejects.toBeInstanceOf(ZodError);
  });
});

describe("TeamRepository : écritures", () => {
  it("createTeamRecord : logo absent du corps quand il est null, 201 → id", async () => {
    const calls = stubApi({ "/api/equipes": { status: 201, body: loadFixture("equipe-created-201.json", "admin-team") } });
    const result = await createTeamRecord({ name: "Pibrac Basket Club", logo: null }, "tok");
    expect(result).toEqual({ kind: "ok", value: { id: 17 } });
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ nom: "Pibrac Basket Club" });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(calls.map((call) => call.path)).toEqual(["/api/equipes"]);
  });

  it("createTeamRecord : logo envoyé quand il existe", async () => {
    const calls = stubApi({ "/api/equipes": { status: 201, body: { Id_Equipe: 18 } } });
    await createTeamRecord({ name: "A", logo: "a.png" }, "tok");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ nom: "A", logo: "a.png" });
  });

  it("createTeamRecord : corps illisible → ok avec id null (l'écriture est faite)", async () => {
    stubApi({ "/api/equipes": { status: 201, body: { surprise: true } } });
    await expect(createTeamRecord({ name: "A", logo: null }, "tok")).resolves.toEqual({ kind: "ok", value: { id: null } });
  });

  it("createTeamRecord : 422 → invalid, 500 → failed/server, réseau → failed/network", async () => {
    const body = loadFixture("equipe-422-required.json", "admin-team");
    stubApi({ "/api/equipes": { status: 422, body } });
    await expect(createTeamRecord({ name: "A", logo: null }, "tok")).resolves.toMatchObject({ kind: "invalid" });
    stubApi({ "/api/equipes": { status: 500, body: { message: "Server Error" } } });
    await expect(createTeamRecord({ name: "A", logo: null }, "tok")).resolves.toEqual({ kind: "failed", reason: "server" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(createTeamRecord({ name: "A", logo: null }, "tok")).resolves.toEqual({ kind: "failed", reason: "network" });
  });

  it("updateTeamRecord : PUT sans logo quand il est null, 404 → notFound", async () => {
    const calls = stubApi({ "/api/equipes/10": loadFixture("equipe-updated-200.json", "admin-team") });
    await expect(updateTeamRecord(10, { name: "B", logo: null }, "tok")).resolves.toEqual({ kind: "ok", value: { id: 10 } });
    expect(calls[0].method).toBe("PUT");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ nom: "B" });
    stubApi({ "/api/equipes/10": { status: 404, body: loadFixture("equipe-404.json", "admin-team") } });
    await expect(updateTeamRecord(10, { name: "B", logo: null }, "tok")).resolves.toMatchObject({ kind: "notFound" });
  });

  it("deleteTeamRecord : 200, 404 et 500", async () => {
    const calls = stubApi({ "/api/equipes/10": loadFixture("equipe-deleted-200.json", "admin-team") });
    await expect(deleteTeamRecord(10, "tok")).resolves.toEqual({ kind: "ok", value: null });
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].body).toBeNull();
    stubApi({ "/api/equipes/10": { status: 404, body: {} } });
    await expect(deleteTeamRecord(10, "tok")).resolves.toMatchObject({ kind: "notFound" });
    stubApi({ "/api/equipes/10": { status: 500, body: loadFixture("equipe-delete-500-stats.json", "admin-team") } });
    await expect(deleteTeamRecord(10, "tok")).resolves.toEqual({ kind: "failed", reason: "server" });
  });

  it("2xx sans corps lisible : suppression réussie", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(deleteTeamRecord(10, "tok")).resolves.toEqual({ kind: "ok", value: null });
  });
});

describe("UserRepository.listAccountLicences", () => {
  it("liste blanche : licences seules, sans null ni doublon", async () => {
    stubApi({
      "/api/users": { users: [...(users as { users: object[] }).users, { username: "bis", joueur: "LIC1000" }] },
    });
    const licences = await listAccountLicences("tok");
    expect(licences).toEqual(["LIC1000", "LIC1001", "LIC2000"]);
    expect(JSON.stringify(licences)).not.toMatch(/username|has_password|marchand/i);
  });

  it("format invalide : lève", async () => {
    stubApi({ "/api/users": { users: "non" } });
    await expect(listAccountLicences("tok")).rejects.toBeInstanceOf(ZodError);
  });
});

describe("GameRepository.listGameTeamRefs", () => {
  it("projette id, saison et noms d'équipes, avec un seul appel HTTP", async () => {
    getCurrentSession.mockResolvedValue({ username: "admin", licence: null, role: "admin", token: "tok" });
    const calls = stubApi({ "/api/matchs": matchs });
    const refs = await listGameTeamRefs();
    expect(refs).toHaveLength(matchs.length);
    expect(refs[0]).toEqual({
      gameId: matchs[0].idMatch,
      seasonId: matchs[0].idSaison,
      homeName: matchs[0].equipeDom,
      awayName: matchs[0].equipeExt,
    });
    expect(calls).toHaveLength(1);
  });
});

describe("readOrNull", () => {
  it("succès : la valeur", async () => {
    await expect(readOrNull(async () => 3)).resolves.toBe(3);
  });

  it("échec : null", async () => {
    await expect(readOrNull(async () => Promise.reject(new Error("boom")))).resolves.toBeNull();
  });

  it("redirect relancé, jamais avalé", async () => {
    await expect(readOrNull(async () => Promise.reject(new NextControlError("REDIRECT:/x")))).rejects.toThrow("REDIRECT:/x");
  });
});
