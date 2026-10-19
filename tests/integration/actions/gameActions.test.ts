import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { loadFixture, type FetchCall } from "../helpers";

class RedirectError extends Error {}

const SECRET = "test-secret-test-secret-test-secret-0123";
const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && jar.value ? { name, value: jar.value } : undefined),
    has: (name: string) => name === "bball_session" && jar.value !== undefined,
  }),
  headers: async () => new Headers({ "x-bball-path": "/admin/game" }),
}));
vi.mock("next/cache", () => cache);
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof RedirectError) throw error;
  },
}));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { createGame, deleteGame, updateGame } = await import("@/actions/gameActions");

const D = "admin-game";
const saisons = loadFixture<Record<string, unknown>[]>("saisons-admin.json", "home");
const matchs = loadFixture("matchs.json", "calendar");
const detail = loadFixture("match-joue.json", "game-detail");
const detailSansStats = loadFixture("match-sans-stats.json", "game-detail");

type Reply = { status?: number; body: unknown };

/** Faux back par « MÉTHODE /chemin ». Chemin inconnu : 404. */
function stubBack(routes: Record<string, Reply | unknown>): FetchCall[] {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      calls.push({
        path: url.pathname,
        method,
        headers: new Headers(init?.headers),
        body: typeof init?.body === "string" ? init.body : null,
        signal: init?.signal ?? null,
      });
      const route = routes[`${method} ${url.pathname}`];
      if (route === undefined) return new Response("{}", { status: 404 });
      const { status, body } =
        typeof route === "object" && route !== null && "body" in route ? (route as Reply) : { status: 200, body: route };
      return new Response(JSON.stringify(body), { status: status ?? 200 });
    }),
  );
  return calls;
}

const READS = { "GET /api/saisons": saisons, "GET /api/matchs": matchs, "GET /api/matchs/47": detail };
const writes = (calls: FetchCall[]) => calls.filter((call) => call.method !== "GET");
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const expectRedirect = (promise: Promise<unknown>, url: string) => expect(promise).rejects.toThrow(`REDIRECT:${url}`);

/** Saison 4 (équipe RPB 1) : journée 19 libre, date dans la saison, FAC Basket reçoit l'équipe 14. */
const CREATE = { seasonId: "4", round: "19", date: "2026-03-14", side: "home", opponentId: "14" };
/** Match 47 tel que lu : OTB (12) reçoit FAC Basket (1), 54-49, vidéo t8QR6Oq4i5s, 10 lignes de stats. */
const UPDATE = {
  gameId: "47",
  seasonId: "4",
  round: "9",
  date: "2026-01-24",
  side: "away",
  opponentId: "12",
  homeScore: "54",
  awayScore: "49",
  video: "t8QR6Oq4i5s",
};

beforeEach(async () => {
  jar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET);
  cache.revalidatePath.mockClear();
  cache.updateTag.mockClear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accès", () => {
  it("joueur : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubBack(READS);
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(await updateGame(IDLE_FORM_STATE, form(UPDATE))).toMatchObject({ message: ADMIN_MESSAGES.forbidden });
    expect(await deleteGame(IDLE_FORM_STATE, form({ gameId: "47" }))).toMatchObject({ message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });
  it("visiteur : redirigé vers la session expirée", async () => {
    jar.value = undefined;
    const calls = stubBack(READS);
    await expect(createGame(IDLE_FORM_STATE, form(CREATE))).rejects.toThrow("REDIRECT:/session/expired");
    expect(calls).toHaveLength(0);
  });
});

describe("createGame", () => {
  it("champs vides : une erreur par champ, aucun appel", async () => {
    const calls = stubBack(READS);
    const state = await createGame(IDLE_FORM_STATE, form({}));
    expect(state).toMatchObject({ status: "error", fieldErrors: { seasonId: expect.any(String), round: expect.any(String), date: expect.any(String), side: expect.any(String), opponentId: expect.any(String) } });
    expect(calls).toHaveLength(0);
  });
  it("journée 0 refusée sans appel", async () => {
    const calls = stubBack(READS);
    expect(await createGame(IDLE_FORM_STATE, form({ ...CREATE, round: "0" }))).toMatchObject({ fieldErrors: { round: GAME_MESSAGES.roundInvalid } });
    expect(calls).toHaveLength(0);
  });
  it("adversaire = équipe RPB de la saison : refusé, aucune écriture", async () => {
    const calls = stubBack(READS);
    expect(await createGame(IDLE_FORM_STATE, form({ ...CREATE, opponentId: "1" }))).toMatchObject({ fieldErrors: { opponentId: GAME_MESSAGES.opponentIsRpb } });
    expect(writes(calls)).toHaveLength(0);
  });
  it("saison sans équipe RPB : refusée", async () => {
    const calls = stubBack({ ...READS, "GET /api/saisons": saisons.map((s) => ({ ...s, equipe: null })) });
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ fieldErrors: { seasonId: GAME_MESSAGES.noRpbTeam } });
    expect(writes(calls)).toHaveLength(0);
  });
  it("saison inconnue : erreur sous le champ", async () => {
    stubBack(READS);
    expect(await createGame(IDLE_FORM_STATE, form({ ...CREATE, seasonId: "99" }))).toMatchObject({ fieldErrors: { seasonId: GAME_MESSAGES.seasonGone } });
  });
  it("lectures de contrôle en échec : aucune écriture (échec fermé)", async () => {
    const calls = stubBack({ ...READS, "GET /api/saisons": { status: 500, body: {} } });
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ message: GAME_MESSAGES.verifyFailed });
    expect(writes(calls)).toHaveLength(0);
  });
  it("journée déjà utilisée : avertissement sans écriture, puis acquittement", async () => {
    const calls = stubBack({ ...READS, "POST /api/matchs": { status: 201, body: loadFixture("match-created-201.json", D) } });
    const state = await createGame(IDLE_FORM_STATE, form({ ...CREATE, round: "9" }));
    expect(state).toMatchObject({
      status: "error",
      message: GAME_MESSAGES.warningsIntro,
      fieldErrors: { ackDuplicateRound: "La journée 9 existe déjà dans cette saison." },
      values: { round: "9", opponentId: "14" },
    });
    expect(writes(calls)).toHaveLength(0);
    await expectRedirect(createGame(IDLE_FORM_STATE, form({ ...CREATE, round: "9", ackDuplicateRound: "on" })), "/admin/game?saison=4&notice=created&ref=54");
    expect(writes(calls)).toHaveLength(1);
  });
  it("date hors saison : avertissement, aucune écriture", async () => {
    const calls = stubBack(READS);
    const state = await createGame(IDLE_FORM_STATE, form({ ...CREATE, date: "2030-01-01" }));
    expect(state).toMatchObject({ fieldErrors: { ackDateOutsideSeason: "Cette date n'est pas dans la saison 2025-2026." } });
    expect(writes(calls)).toHaveLength(0);
  });
  it("succès : payload exact sans score ni vidéo, rafraîchissement, palmarès intact", async () => {
    const calls = stubBack({ ...READS, "POST /api/matchs": { status: 201, body: loadFixture("match-created-201.json", D) } });
    await expectRedirect(createGame(IDLE_FORM_STATE, form(CREATE)), "/admin/game?saison=4&notice=created&ref=54");
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({
      Id_Saison: 4,
      numero: 19,
      date_match: "2026-03-14",
      equipe_domicile: 1,
      equipe_exterieur: 14,
    });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/game");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
  it("côté extérieur : le RPB est l'équipe extérieure", async () => {
    const calls = stubBack({ ...READS, "POST /api/matchs": { status: 201, body: {} } });
    await expectRedirect(createGame(IDLE_FORM_STATE, form({ ...CREATE, side: "away" })), "/admin/game?saison=4&notice=created");
    expect(JSON.parse(writes(calls)[0].body ?? "")).toMatchObject({ equipe_domicile: 14, equipe_exterieur: 1 });
  });
  it("404 équipe / saison : erreur sous le bon champ, jamais la phrase du back", async () => {
    stubBack({ ...READS, "POST /api/matchs": { status: 404, body: loadFixture("match-404-equipe.json", D) } });
    const team = await createGame(IDLE_FORM_STATE, form(CREATE));
    expect(team).toMatchObject({ fieldErrors: { opponentId: GAME_MESSAGES.teamGone } });
    stubBack({ ...READS, "POST /api/matchs": { status: 404, body: loadFixture("match-404-saison.json", D) } });
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ fieldErrors: { seasonId: GAME_MESSAGES.seasonGone } });
    expect(JSON.stringify(team)).not.toContain("n'existe pas");
  });
  it("422 mappé, 500, réseau", async () => {
    stubBack({ ...READS, "POST /api/matchs": { status: 422, body: loadFixture("match-422-date.json", D) } });
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ fieldErrors: { date: GAME_MESSAGES.dateRejected } });
    stubBack({ ...READS, "POST /api/matchs": { status: 500, body: {} } });
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ message: ADMIN_MESSAGES.serverWrite });
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      if ((init?.method ?? "GET") === "POST") throw new TypeError("fetch failed");
      const path = new URL(String(input)).pathname;
      return new Response(JSON.stringify(path === "/api/saisons" ? saisons : matchs));
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await createGame(IDLE_FORM_STATE, form(CREATE))).toMatchObject({ message: ADMIN_MESSAGES.networkWrite });
  });
});

describe("updateGame", () => {
  const PUT = "PUT /api/matchs/47";
  const ok = { ...READS, [PUT]: loadFixture("match-updated-200.json", D) };
  const payload = (calls: FetchCall[]) => JSON.parse(writes(calls)[0].body ?? "");

  it("rien ne change : PUT complet, redirection avec la notice, palmarès invalidé", async () => {
    const calls = stubBack(ok);
    await expectRedirect(updateGame(IDLE_FORM_STATE, form(UPDATE)), "/admin/game?saison=4&notice=updated&ref=47");
    expect(payload(calls)).toEqual({
      Id_Saison: 4,
      numero: 9,
      date_match: "2026-01-24",
      equipe_domicile: 12,
      equipe_exterieur: 1,
      score_domicile: 54,
      score_exterieur: 49,
      video: "t8QR6Oq4i5s",
    });
    expect(cache.updateTag).toHaveBeenCalled();
  });
  it("un seul score, négatif, décimal : refusés d'un coup avec les autres erreurs, aucun PUT", async () => {
    const calls = stubBack(ok);
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, awayScore: "" }))).toMatchObject({ fieldErrors: { awayScore: GAME_MESSAGES.scoreMissingOther } });
    const many = await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, homeScore: "-3", round: "0" }));
    expect(many).toMatchObject({ fieldErrors: { homeScore: GAME_MESSAGES.scoreInvalid, round: GAME_MESSAGES.roundInvalid } });
    expect(writes(calls)).toHaveLength(0);
  });
  it("deux scores vides : match non joué envoyé 0/0", async () => {
    const calls = stubBack(ok);
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, homeScore: "", awayScore: "" })), "/admin/game?saison=4&notice=updated&ref=47");
    expect(payload(calls)).toMatchObject({ score_domicile: 0, score_exterieur: 0 });
  });
  it("URL YouTube normalisée en identifiant ; texte invalide et retrait refusés", async () => {
    const calls = stubBack(ok);
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, video: "https://www.youtube.com/watch?v=abcdefghijk" })), "/admin/game?saison=4&notice=updated&ref=47");
    expect(payload(calls).video).toBe("abcdefghijk");
    const bad = stubBack(ok);
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, video: "pas une vidéo" }))).toMatchObject({ fieldErrors: { video: GAME_MESSAGES.videoInvalid } });
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, video: "" }))).toMatchObject({ fieldErrors: { video: GAME_MESSAGES.videoRemovalUnsupported } });
    expect(writes(bad)).toHaveLength(0);
  });
  it("vidéo vide sans vidéo enregistrée : acceptée, envoyée nulle", async () => {
    const calls = stubBack({ ...ok, "GET /api/matchs/47": detailSansStats });
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, video: "", round: "9" })), "/admin/game?saison=4&notice=updated&ref=47");
    expect(payload(calls).video).toBeNull();
  });
  it("changement de saison avec stats : avertissement chiffré, aucun PUT avant la coche", async () => {
    const calls = stubBack(ok);
    const state = await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, seasonId: "1", round: "99", date: "2025-02-01" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { ackStatsMove: expect.stringContaining("10 lignes de statistiques") } });
    expect(writes(calls)).toHaveLength(0);
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, seasonId: "1", round: "99", date: "2025-02-01", ackStatsMove: "on" })), "/admin/game?saison=1&notice=updated&ref=47");
    expect(payload(calls).Id_Saison).toBe(1);
  });
  it("changement d'adversaire avec stats : avertissement ; sans stats : aucun", async () => {
    const calls = stubBack(ok);
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, opponentId: "7" }))).toMatchObject({ fieldErrors: { ackStatsMove: expect.any(String) } });
    expect(writes(calls)).toHaveLength(0);
    const free = stubBack({ ...ok, "GET /api/matchs/47": detailSansStats });
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, opponentId: "7" })), "/admin/game?saison=4&notice=updated&ref=47");
    expect(writes(free)).toHaveLength(1);
  });
  it("nombre de stats illisible : avertissement « inconnu »", async () => {
    stubBack({ ...ok, "GET /api/matchs/47": { ...(detail as object), stats: "illisible" } });
    const state = await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, opponentId: "7" }));
    expect(state).toMatchObject({ fieldErrors: { ackStatsMove: expect.stringContaining("inconnu") } });
  });
  it("égalité : avertissement puis acquittement", async () => {
    const calls = stubBack(ok);
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, homeScore: "60", awayScore: "60" }))).toMatchObject({ fieldErrors: { ackScoreTie: expect.stringContaining("(60)") } });
    expect(writes(calls)).toHaveLength(0);
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, homeScore: "60", awayScore: "60", ackScoreTie: "on" })), "/admin/game?saison=4&notice=updated&ref=47");
  });
  it("match hérité sans l'équipe RPB : équipes inchangées dans le payload", async () => {
    const calls = stubBack({ ...ok, "GET /api/saisons": saisons.map((s) => ({ ...s, equipe: 5 })) });
    await expectRedirect(updateGame(IDLE_FORM_STATE, form({ ...UPDATE, side: "", opponentId: "", homeScore: "60", awayScore: "50" })), "/admin/game?saison=4&notice=updated&ref=47");
    expect(payload(calls)).toMatchObject({ equipe_domicile: 12, equipe_exterieur: 1, score_domicile: 60 });
  });
  it("match disparu : « n'existe plus » et rafraîchissement", async () => {
    stubBack({ ...ok, "GET /api/matchs/47": { status: 404, body: {} } });
    expect(await updateGame(IDLE_FORM_STATE, form(UPDATE))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalled();
  });
  it("PUT en 404 « Match non trouvé » : gone + rafraîchissement ; 404 équipe : sous le champ sans rafraîchir", async () => {
    stubBack({ ...READS, [PUT]: { status: 404, body: loadFixture("match-404.json", D) } });
    expect(await updateGame(IDLE_FORM_STATE, form(UPDATE))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalled();
    cache.revalidatePath.mockClear();
    stubBack({ ...READS, [PUT]: { status: 404, body: loadFixture("match-404-equipe.json", D) } });
    expect(await updateGame(IDLE_FORM_STATE, form(UPDATE))).toMatchObject({ fieldErrors: { opponentId: GAME_MESSAGES.teamGone } });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
  it("identifiant invalide : gone, aucun appel", async () => {
    const calls = stubBack(ok);
    expect(await updateGame(IDLE_FORM_STATE, form({ ...UPDATE, gameId: "abc" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });
  it("lecture du match en échec : aucune écriture", async () => {
    const calls = stubBack({ ...ok, "GET /api/matchs/47": { status: 500, body: {} } });
    expect(await updateGame(IDLE_FORM_STATE, form(UPDATE))).toMatchObject({ message: GAME_MESSAGES.verifyFailed });
    expect(writes(calls)).toHaveLength(0);
  });
});

describe("deleteGame", () => {
  const DEL = "DELETE /api/matchs/47";
  it("succès : un seul DELETE, redirection vers la saison, palmarès invalidé", async () => {
    const calls = stubBack({ [DEL]: loadFixture("match-delete-200.json", D) });
    await expectRedirect(deleteGame(IDLE_FORM_STATE, form({ gameId: "47", seasonId: "4" })), "/admin/game?saison=4&notice=deleted");
    expect(calls).toHaveLength(1);
    expect(cache.updateTag).toHaveBeenCalled();
  });
  it("saison invalide ignorée : liste nue", async () => {
    stubBack({ [DEL]: {} });
    await expectRedirect(deleteGame(IDLE_FORM_STATE, form({ gameId: "47", seasonId: "x" })), "/admin/game?notice=deleted");
  });
  it("404 : gone et rafraîchissement ; 500 : deleteFailed sans rafraîchir ; identifiant invalide : aucun appel", async () => {
    stubBack({ [DEL]: { status: 404, body: loadFixture("match-404.json", D) } });
    expect(await deleteGame(IDLE_FORM_STATE, form({ gameId: "47" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalled();
    cache.revalidatePath.mockClear();
    stubBack({ [DEL]: { status: 500, body: loadFixture("match-delete-500-stats.json", D) } });
    expect(await deleteGame(IDLE_FORM_STATE, form({ gameId: "47" }))).toMatchObject({ message: ADMIN_MESSAGES.deleteFailed });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    const calls = stubBack({});
    expect(await deleteGame(IDLE_FORM_STATE, form({ gameId: "0" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });
});
