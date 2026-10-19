import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import type { PlayerInput } from "@/models/PlayerInput";
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

const {
  createPlayerRecord,
  deletePlayerRecord,
  enrollPlayerInSeason,
  getAdminPlayer,
  getPlayerAccount,
  getPlayerDeletionFigures,
  getPlayerEnrollment,
  listAdminPlayers,
  updatePlayerRecord,
} = await import("@/repositories/AdminPlayerRepository");
const { countPlayerStatLines } = await import("@/repositories/PlayerStatsRepository");

const joueurs = loadFixture<{ joueurs: Record<string, unknown>[] }>("joueurs.json", "player");
const complet = loadFixture<{ joueur: Record<string, unknown>; stats: unknown[]; examens: unknown[] }>("joueur-complet.json", "player");
const users = loadFixture("users.json", "admin-team");
const saisonsJoueur = loadFixture("saisons-joueur-LIC2000.json", "player");
const physics = loadFixture<unknown[]>("physics.json", "player");
const saisons = loadFixture("saisons-admin.json", "home");

const INPUT: PlayerInput = {
  licence: "AB12",
  lastName: "Durand",
  firstName: "Paul",
  civility: "M",
  birthDate: "2011-03-12",
  photo: null,
  teamId: 3,
};

beforeEach(() => {
  getCurrentSession.mockResolvedValue({ username: "admin", licence: null, role: "admin", token: "tok" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  getCurrentSession.mockReset();
});

describe("listAdminPlayers", () => {
  it("nominal : identité, équipe, données personnelles et nom de fichier brut, jeton transmis", async () => {
    const calls = stubApi({ "/api/joueurs": joueurs });
    const players = await listAdminPlayers();
    expect(players).toHaveLength(joueurs.joueurs.length);
    expect(players[0]).toEqual({
      player: { licence: "LIC1001", lastName: "DURAND", firstName: "Paul", photoUrl: "http://api.test/public/images/joueur/durand.png" },
      team: { id: 1, name: "FAC Basket", logoUrl: "http://api.test/public/images/logo/logo_frouzins.png" },
      personalInfo: { civility: "M", birthDate: "2011-01-01" },
      photoFile: "durand.png",
    });
    expect(players.find((player) => player.player.licence === "LIC1007")).toMatchObject({
      photoFile: null,
      player: { photoUrl: null },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(JSON.stringify(players)).not.toContain("physics");
  });

  it("liste vide", async () => {
    stubApi({ "/api/joueurs": loadFixture("joueurs-vide.json", "admin-player") });
    await expect(listAdminPlayers()).resolves.toEqual([]);
  });

  it("une ligne invalide fait échouer la lecture, jamais une liste partielle", async () => {
    stubApi({ "/api/joueurs": loadFixture("joueurs-ligne-invalide.json", "admin-player") });
    await expect(listAdminPlayers()).rejects.toBeInstanceOf(ZodError);
  });

  it("500 : lève", async () => {
    stubApi({ "/api/joueurs": { status: 500, body: { message: "Server Error" } } });
    await expect(listAdminPlayers()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getAdminPlayer", () => {
  it("tranche joueur seule : nom de fichier brut conservé, stats et examens ignorés", async () => {
    stubApi({ "/api/joueurs/LIC1000": complet });
    await expect(getAdminPlayer("LIC1000")).resolves.toMatchObject({
      player: { licence: "LIC1000", lastName: "MARCHAND", firstName: "Lucas" },
      personalInfo: { civility: "M", birthDate: "2011-02-08" },
      photoFile: "marchand.png",
    });
  });

  it("stats et examens invalides sans effet", async () => {
    stubApi({ "/api/joueurs/LIC1000": { joueur: complet.joueur, stats: "n'importe quoi", examens: 12 } });
    await expect(getAdminPlayer("LIC1000")).resolves.toMatchObject({ player: { licence: "LIC1000" } });
  });

  it("404 : null ; 500 : lève ; format invalide : lève", async () => {
    stubApi({ "/api/joueurs/LICX": { status: 404, body: loadFixture("update-404.json", "admin-player") } });
    await expect(getAdminPlayer("LICX")).resolves.toBeNull();
    stubApi({ "/api/joueurs/LICX": { status: 500, body: {} } });
    await expect(getAdminPlayer("LICX")).rejects.toBeInstanceOf(ApiError);
    stubApi({ "/api/joueurs/LICX": { joueur: { licence: "LICX" } } });
    await expect(getAdminPlayer("LICX")).rejects.toBeInstanceOf(ZodError);
  });
});

describe("getPlayerAccount", () => {
  it("trouvé : identifiant lu (jamais recalculé) et état du mot de passe", async () => {
    const calls = stubApi({ "/api/users": users });
    await expect(getPlayerAccount("LIC1000", "tok")).resolves.toEqual({ username: "lucas.marchand", hasPassword: true });
    await expect(getPlayerAccount("LIC1001", "tok")).resolves.toEqual({ username: "paul.durand", hasPassword: false });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("absent : null (joueur sans compte, compte sans joueur ignoré)", async () => {
    stubApi({ "/api/users": users });
    await expect(getPlayerAccount("LIC1002", "tok")).resolves.toBeNull();
  });

  it("has_password en chaîne", async () => {
    stubApi({ "/api/users": loadFixture("users-has-password-chaine.json", "admin-player") });
    await expect(getPlayerAccount("LIC1001", "tok")).resolves.toEqual({ username: "paul.durand", hasPassword: false });
    await expect(getPlayerAccount("LIC1000", "tok")).resolves.toEqual({ username: "lucas.marchand", hasPassword: true });
  });

  it("format invalide ou 500 : lève", async () => {
    stubApi({ "/api/users": { users: "non" } });
    await expect(getPlayerAccount("LIC1000", "tok")).rejects.toBeInstanceOf(ZodError);
    stubApi({ "/api/users": { status: 500, body: {} } });
    await expect(getPlayerAccount("LIC1000", "tok")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("countPlayerStatLines", () => {
  it("nombre de lignes sans valider leur contenu ; illisible ou 404 : null", async () => {
    stubApi({ "/api/joueurs/LIC1000": { ...complet, stats: [{ x: 1 }, { y: 2 }] } });
    await expect(countPlayerStatLines("LIC1000")).resolves.toBe(2);
    stubApi({ "/api/joueurs/LIC1000": { ...complet, stats: "non" } });
    await expect(countPlayerStatLines("LIC1000")).resolves.toBeNull();
    stubApi({ "/api/joueurs/LIC1000": { status: 404, body: {} } });
    await expect(countPlayerStatLines("LIC1000")).resolves.toBeNull();
  });
});

describe("getPlayerDeletionFigures : cinq lectures indépendantes", () => {
  const nominal = {
    "/api/users": users,
    "/saisons/LIC1000": saisonsJoueur,
    "/api/joueurs/LIC1000": { ...complet, stats: [{}, {}, {}], examens: [{}, {}] },
    "/physics/LIC1000": physics,
  };

  it("tout lisible : les cinq chiffres", async () => {
    stubApi(nominal);
    await expect(getPlayerDeletionFigures("LIC1000", "tok")).resolves.toEqual({
      accountCount: 1,
      seasonCount: 1,
      statLineCount: 3,
      examCount: 2,
      measurementCount: physics.length,
    });
  });

  it("joueur sans compte ni inscription : 0, pas null", async () => {
    stubApi({ ...nominal, "/api/users": { users: [] }, "/saisons/LIC1000": [], "/physics/LIC1000": [] });
    const figures = await getPlayerDeletionFigures("LIC1000", "tok");
    expect(figures).toMatchObject({ accountCount: 0, seasonCount: 0, measurementCount: 0 });
  });

  it("mesures de types inconnus comptées aussi", async () => {
    stubApi({
      ...nominal,
      "/physics/LIC1000": [
        { id: "1", date_physics: "2026-01-01", type: "size", value: 170 },
        { id: "2", date_physics: "2026-01-02", type: "bizarre", value: 1 },
        { id: "3", date_physics: "2026-01-03", type: "bizarre", value: 2 },
      ],
    });
    const figures = await getPlayerDeletionFigures("LIC1000", "tok");
    expect(figures.measurementCount).toBe(3);
  });

  it.each([
    ["/api/users", "accountCount"],
    ["/saisons/LIC1000", "seasonCount"],
    ["/physics/LIC1000", "measurementCount"],
  ] as const)("%s en échec : %s vaut null, les autres sont comptées", async (path, field) => {
    stubApi({ ...nominal, [path]: { status: 500, body: {} } });
    const figures = await getPlayerDeletionFigures("LIC1000", "tok");
    expect(figures[field]).toBeNull();
    const others = Object.entries(figures).filter(([key]) => key !== field);
    expect(others.every(([, value]) => value !== null)).toBe(true);
  });

  it("tranche stats illisible : statLineCount null seul ; tranche examens illisible : examCount null seul", async () => {
    stubApi({ ...nominal, "/api/joueurs/LIC1000": { ...complet, stats: "non", examens: [{}] } });
    await expect(getPlayerDeletionFigures("LIC1000", "tok")).resolves.toMatchObject({ statLineCount: null, examCount: 1 });
    stubApi({ ...nominal, "/api/joueurs/LIC1000": { ...complet, stats: [{}], examens: "non" } });
    await expect(getPlayerDeletionFigures("LIC1000", "tok")).resolves.toMatchObject({ statLineCount: 1, examCount: null });
  });

  it("format invalide d'une source : null, jamais 0", async () => {
    stubApi({ ...nominal, "/api/users": { users: "non" } });
    expect((await getPlayerDeletionFigures("LIC1000", "tok")).accountCount).toBeNull();
  });

  it("tout en échec : cinq null, aucune levée", async () => {
    stubApi({});
    await expect(getPlayerDeletionFigures("LIC1000", "tok")).resolves.toEqual({
      accountCount: null,
      seasonCount: null,
      statLineCount: null,
      examCount: null,
      measurementCount: null,
    });
  });

  it("redirect (session expirée) relancé, jamais avalé", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new NextControlError("REDIRECT:/session/expired"))));
    await expect(getPlayerDeletionFigures("LIC1000", "tok")).rejects.toThrow("REDIRECT:/session/expired");
  });
});

describe("getPlayerEnrollment", () => {
  it("saisons et inscriptions du joueur", async () => {
    stubApi({ "/api/saisons": saisons, "/saisons/LIC1000": saisonsJoueur });
    const result = await getPlayerEnrollment("LIC1000", "tok");
    expect(result.seasons.map((season) => season.id)).toEqual([4, 1]);
    expect(result.enrolledSeasonIds).toEqual([4]);
  });

  it("une lecture en échec fait lever", async () => {
    stubApi({ "/api/saisons": saisons });
    await expect(getPlayerEnrollment("LIC1000", "tok")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("AdminPlayerRepository : écritures", () => {
  it("createPlayerRecord : POST avec equipe (jamais Id_Equipe), photo null explicite, licence soumise rendue", async () => {
    const calls = stubApi({ "/api/joueurs": { status: 201, body: loadFixture("joueur-cree-201.json", "admin-player") } });
    await expect(createPlayerRecord(INPUT, "tok")).resolves.toEqual({ kind: "ok", value: { licence: "AB12" } });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({
      licence: "AB12",
      nom: "Durand",
      prenom: "Paul",
      civilite: "M",
      date_naissance: "2011-03-12",
      equipe: 3,
      photo: null,
    });
  });

  it("createPlayerRecord : 422 → invalid, 500 → failed/server, réseau → failed/network, réponse illisible → ok", async () => {
    stubApi({ "/api/joueurs": { status: 422, body: loadFixture("creation-422-licence.json", "admin-player") } });
    await expect(createPlayerRecord(INPUT, "tok")).resolves.toMatchObject({
      kind: "invalid",
      errors: { licence: ["The licence has already been taken."] },
    });
    stubApi({ "/api/joueurs": { status: 500, body: loadFixture("creation-500.json", "admin-player") } });
    await expect(createPlayerRecord(INPUT, "tok")).resolves.toEqual({ kind: "failed", reason: "server" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(createPlayerRecord(INPUT, "tok")).resolves.toEqual({ kind: "failed", reason: "network" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 201 })));
    await expect(createPlayerRecord(INPUT, "tok")).resolves.toEqual({ kind: "ok", value: { licence: "AB12" } });
  });

  it("updatePlayerRecord : PUT avec Id_Equipe, sans licence, photo toujours présente", async () => {
    const calls = stubApi({ "/api/joueurs/AB12": loadFixture("update-200.json", "admin-player") });
    await expect(updatePlayerRecord({ ...INPUT, photo: "durand.png" }, "tok")).resolves.toEqual({ kind: "ok", value: null });
    expect(calls[0].method).toBe("PUT");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({
      nom: "Durand",
      prenom: "Paul",
      civilite: "M",
      date_naissance: "2011-03-12",
      photo: "durand.png",
      Id_Equipe: 3,
    });
    await updatePlayerRecord(INPUT, "tok");
    expect(JSON.parse(calls[1].body ?? "")).toHaveProperty("photo", null);
    expect(JSON.parse(calls[1].body ?? "")).not.toHaveProperty("licence");
  });

  it("updatePlayerRecord : 404 → notFound, 422 → invalid", async () => {
    stubApi({ "/api/joueurs/AB12": { status: 404, body: loadFixture("update-404.json", "admin-player") } });
    await expect(updatePlayerRecord(INPUT, "tok")).resolves.toMatchObject({ kind: "notFound" });
    stubApi({ "/api/joueurs/AB12": { status: 422, body: loadFixture("creation-422-equipe.json", "admin-player") } });
    await expect(updatePlayerRecord(INPUT, "tok")).resolves.toMatchObject({ kind: "invalid" });
  });

  it("deletePlayerRecord : DELETE sans corps, licence encodée ; 404 et 500", async () => {
    const calls = stubApi({ "/api/joueurs/A%20B": loadFixture("delete-200.json", "admin-player") });
    await expect(deletePlayerRecord("A B", "tok")).resolves.toEqual({ kind: "ok", value: null });
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].body).toBeNull();
    stubApi({ "/api/joueurs/LIC1": { status: 404, body: {} } });
    await expect(deletePlayerRecord("LIC1", "tok")).resolves.toMatchObject({ kind: "notFound" });
    stubApi({ "/api/joueurs/LIC1": { status: 500, body: loadFixture("delete-500-stats.json", "admin-player") } });
    await expect(deletePlayerRecord("LIC1", "tok")).resolves.toEqual({ kind: "failed", reason: "server" });
  });

  it("enrollPlayerInSeason : POST /api/participer avec Id_Saison et licence ; 422 → invalid", async () => {
    const calls = stubApi({ "/api/participer": { status: 201, body: loadFixture("participer-201.json", "admin-player") } });
    await expect(enrollPlayerInSeason("LIC1", 4, "tok")).resolves.toEqual({ kind: "ok", value: null });
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1" });
    stubApi({ "/api/participer": { status: 422, body: loadFixture("participer-422.json", "admin-player") } });
    await expect(enrollPlayerInSeason("LIC1", 4, "tok")).resolves.toMatchObject({ kind: "invalid" });
  });

  it("aucune erreur ne contient le jeton ni la charge utile", async () => {
    stubApi({ "/api/joueurs": { status: 500, body: { message: "Server Error" } } });
    const result = await createPlayerRecord(INPUT, "tok-secret");
    expect(JSON.stringify(result)).not.toMatch(/tok-secret|Durand|2011-03-12/);
  });
});
