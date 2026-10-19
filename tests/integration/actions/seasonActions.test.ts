import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { SEASON_MESSAGES } from "@/models/seasonMessages";
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
  headers: async () => new Headers({ "x-bball-path": "/admin/season" }),
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
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { checkSeasonReferences } = await import("@/actions/support/checkSeasonReferences");
const { addSeasonParticipant, createSeason, deleteSeason, removeSeasonParticipant, updateSeason } = await import(
  "@/actions/seasonActions"
);

const D = "admin-season";
const equipes = loadFixture("equipes.json", "admin-team");
const saisons = loadFixture<Record<string, unknown>[]>("saisons-admin.json", "home");
const show = loadFixture("season-show-200.json", D);

type Reply = { status?: number; body: unknown };

/** Faux back par « MÉTHODE /chemin ». Chemin inconnu : 404. Renvoie les appels enregistrés. */
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

const READS = { "GET /api/equipes": equipes, "GET /api/saisons": saisons };
const writes = (calls: FetchCall[]) => calls.filter((call) => call.method !== "GET");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = { startYear: "2026", endYear: "2027", championship: "Régionale 2", category: "Senior", teamId: "1" };

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`REDIRECT:${url}`);
}

beforeEach(async () => {
  jar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET);
  cache.revalidatePath.mockClear();
  cache.updateTag.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const asPlayer = async () => {
  jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
};

describe("accès : aucune des 5 actions ne lit ni n'écrit sans administrateur", () => {
  it("joueur : refusé sans aucun appel", async () => {
    await asPlayer();
    const calls = stubBack(READS);
    expect(await createSeason(IDLE_FORM_STATE, form(VALID))).toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(await updateSeason(IDLE_FORM_STATE, form({ ...VALID, id: "4" }))).toMatchObject({ message: ADMIN_MESSAGES.forbidden });
    expect(await deleteSeason(IDLE_FORM_STATE, form({ id: "4" }))).toMatchObject({ message: ADMIN_MESSAGES.forbidden });
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC1000" })).toEqual({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(await removeSeasonParticipant({ seasonId: 4, licence: "LIC1000" })).toEqual({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });

  it("visiteur : redirigé vers la session expirée, aucun appel", async () => {
    jar.value = undefined;
    const calls = stubBack(READS);
    await expectRedirect(createSeason(IDLE_FORM_STATE, form(VALID)), "/session/expired?redirect=%2Fadmin%2Fseason");
    await expect(addSeasonParticipant({ seasonId: 4, licence: "LIC1000" })).rejects.toThrow("REDIRECT:/session/expired");
    expect(calls).toHaveLength(0);
  });
});

describe("createSeason", () => {
  it("champ vide, années incohérentes, équipe non choisie : erreurs de champ, aucun appel, jamais equipe = 0", async () => {
    const calls = stubBack(READS);
    const empty = await createSeason(IDLE_FORM_STATE, form({ ...VALID, startYear: "", teamId: "" }));
    expect(empty).toMatchObject({
      status: "error",
      fieldErrors: { startYear: SEASON_MESSAGES.startYearRequired, teamId: SEASON_MESSAGES.teamRequired },
      values: { championship: "Régionale 2", teamId: "" },
    });
    const order = await createSeason(IDLE_FORM_STATE, form({ ...VALID, startYear: "2026", endYear: "2024" }));
    expect(order).toMatchObject({ fieldErrors: { endYear: SEASON_MESSAGES.yearOrder } });
    expect(calls).toHaveLength(0);
  });

  it("équipe inexistante : erreur du champ teamId sans écriture", async () => {
    const calls = stubBack(READS);
    const state = await createSeason(IDLE_FORM_STATE, form({ ...VALID, teamId: "999" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { teamId: SEASON_MESSAGES.teamGone } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("doublon strict (casse et accents) : message dédié sans écriture", async () => {
    const calls = stubBack(READS);
    const state = await createSeason(
      IDLE_FORM_STATE,
      form({ startYear: "2025", endYear: "2026", championship: " d1 ", category: "u15g", teamId: "1" }),
    );
    expect(state).toMatchObject({ status: "error", message: SEASON_MESSAGES.duplicate });
    expect(writes(calls)).toHaveLength(0);
  });

  it("équipes ou saisons illisibles : échec fermé, aucune écriture", async () => {
    let calls = stubBack({ "GET /api/equipes": { status: 500, body: {} }, "GET /api/saisons": saisons });
    expect(await createSeason(IDLE_FORM_STATE, form(VALID))).toMatchObject({ message: SEASON_MESSAGES.teamsUnavailable });
    expect(writes(calls)).toHaveLength(0);
    calls = stubBack({ "GET /api/equipes": equipes, "GET /api/saisons": { status: 500, body: {} } });
    expect(await createSeason(IDLE_FORM_STATE, form(VALID))).toMatchObject({ message: SEASON_MESSAGES.teamsUnavailable });
    expect(writes(calls)).toHaveLength(0);
  });

  it("succès : POST, rafraîchissement puis édition de la saison créée avec la notice", async () => {
    const calls = stubBack({ ...READS, "POST /api/saisons": { status: 201, body: loadFixture("season-create-201.json", D) } });
    await expectRedirect(createSeason(IDLE_FORM_STATE, form(VALID)), "/admin/season/17/edit?notice=created");
    const [write] = writes(calls);
    expect(JSON.parse(write.body ?? "")).toEqual({
      annee_debut: 2026,
      annee_fin: 2027,
      championnat: "Régionale 2",
      categorie: "Senior",
      equipe: 1,
    });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("succès avec un identifiant illisible : retour à la liste", async () => {
    stubBack({ ...READS, "POST /api/saisons": { status: 201, body: {} } });
    await expectRedirect(createSeason(IDLE_FORM_STATE, form(VALID)), "/admin/season?notice=created");
  });

  it("422 en anglais : erreur de champ française", async () => {
    stubBack({ ...READS, "POST /api/saisons": { status: 422, body: loadFixture("season-422-required.json", D) } });
    const state = await createSeason(IDLE_FORM_STATE, form(VALID));
    expect(state).toMatchObject({ status: "error", fieldErrors: { startYear: "Ce champ est obligatoire." } });
    expect(JSON.stringify(state)).not.toContain("The annee");
  });

  it("500 : message serveur, aucun rafraîchissement", async () => {
    stubBack({ ...READS, "POST /api/saisons": { status: 500, body: {} } });
    expect(await createSeason(IDLE_FORM_STATE, form(VALID))).toMatchObject({ message: ADMIN_MESSAGES.serverWrite });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("une seconde soumission identique tombe sur le doublon (une seule saison)", async () => {
    const created = { Id_Saison: 17, annee_debut: 2026, annee_fin: 2027, championnat: "Régionale 2", categorie: "Senior", equipe: 1 };
    const calls = stubBack({ ...READS, "POST /api/saisons": { status: 201, body: created } });
    await expectRedirect(createSeason(IDLE_FORM_STATE, form(VALID)), "/admin/season/17/edit?notice=created");
    stubBack({ ...READS, "GET /api/saisons": [...saisons, created] });
    const second = await createSeason(IDLE_FORM_STATE, form(VALID));
    expect(second).toMatchObject({ message: SEASON_MESSAGES.duplicate });
    expect(writes(calls)).toHaveLength(1);
  });
});

describe("updateSeason", () => {
  const edit = { ...VALID, startYear: "2025", endYear: "2026", championship: "D1", category: "U17G", id: "4" };

  it("identifiant invalide : saison disparue, aucun appel", async () => {
    const calls = stubBack(READS);
    expect(await updateSeason(IDLE_FORM_STATE, form({ ...edit, id: "abc" }))).toMatchObject({ message: SEASON_MESSAGES.seasonGone });
    expect(calls).toHaveLength(0);
  });

  it("une saison qui se retrouve identique à elle-même n'est pas un doublon", async () => {
    stubBack({ ...READS, "PUT /api/saisons/4": loadFixture("season-update-200.json", D) });
    await expectRedirect(
      updateSeason(IDLE_FORM_STATE, form({ ...edit, championship: "D1", category: "U15G" })),
      "/admin/season?notice=updated&ref=4",
    );
  });

  it("doublon d'une autre saison : refusé sans écriture", async () => {
    const calls = stubBack(READS);
    const state = await updateSeason(IDLE_FORM_STATE, form({ ...edit, id: "4", startYear: "2024", endYear: "2025", championship: "D3", category: "U15G" }));
    expect(state).toMatchObject({ message: SEASON_MESSAGES.duplicate });
    expect(writes(calls)).toHaveLength(0);
  });

  it("succès : PUT, rafraîchissement, retour à la liste avec ref", async () => {
    const calls = stubBack({ ...READS, "PUT /api/saisons/4": loadFixture("season-update-200.json", D) });
    await expectRedirect(updateSeason(IDLE_FORM_STATE, form(edit)), "/admin/season?notice=updated&ref=4");
    expect(writes(calls)[0]).toMatchObject({ method: "PUT", path: "/api/saisons/4" });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("404 : saison disparue, liste rafraîchie", async () => {
    stubBack({ ...READS, "PUT /api/saisons/4": { status: 404, body: loadFixture("season-show-404.json", D) } });
    const state = await updateSeason(IDLE_FORM_STATE, form(edit));
    expect(state).toMatchObject({ status: "error", message: SEASON_MESSAGES.seasonGone });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season");
  });

  it("validation : erreurs de champ, aucun appel", async () => {
    const calls = stubBack(READS);
    expect(await updateSeason(IDLE_FORM_STATE, form({ ...edit, championship: "" }))).toMatchObject({
      fieldErrors: { championship: SEASON_MESSAGES.championshipRequired },
    });
    expect(calls).toHaveLength(0);
  });
});

describe("deleteSeason", () => {
  it("identifiant invalide : « n'existe plus », aucun appel", async () => {
    const calls = stubBack({});
    expect(await deleteSeason(IDLE_FORM_STATE, form({ id: "0" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });

  it("succès : un seul DELETE, rafraîchissement et palmarès invalidé, retour à la liste", async () => {
    const calls = stubBack({ "DELETE /api/saisons/4": loadFixture("season-delete-200.json", D) });
    await expectRedirect(deleteSeason(IDLE_FORM_STATE, form({ id: "4" })), "/admin/season?notice=deleted");
    expect(calls).toHaveLength(1);
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season");
    expect(cache.updateTag).toHaveBeenCalledWith("hall-of-fame");
  });

  it("404 : « n'existe plus » et liste rafraîchie", async () => {
    stubBack({ "DELETE /api/saisons/4": { status: 404, body: loadFixture("season-delete-404.json", D) } });
    expect(await deleteSeason(IDLE_FORM_STATE, form({ id: "4" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season");
  });

  it("500 (cascade manquante) : message de suppression échouée, aucun rafraîchissement", async () => {
    stubBack({ "DELETE /api/saisons/4": { status: 500, body: loadFixture("season-delete-500-stats.json", D) } });
    expect(await deleteSeason(IDLE_FORM_STATE, form({ id: "4" }))).toMatchObject({ message: ADMIN_MESSAGES.deleteFailed });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
});

describe("addSeasonParticipant", () => {
  const SHOW = { "GET /api/saisons/4": show };

  it("entrées invalides : aucun appel", async () => {
    const calls = stubBack(SHOW);
    for (const input of [
      { seasonId: 0, licence: "LIC1" },
      { seasonId: -3, licence: "LIC1" },
      { seasonId: 1.5, licence: "LIC1" },
      { seasonId: 4, licence: "" },
      { seasonId: 4, licence: "TROPLONGUE" },
      { seasonId: 4, licence: "a b" },
      { seasonId: "4" as unknown as number, licence: "LIC1" },
    ]) {
      expect(await addSeasonParticipant(input)).toEqual({ status: "error", message: SEASON_MESSAGES.participantGone });
    }
    expect(calls).toHaveLength(0);
  });

  it("déjà inscrit : « unchanged » sans POST ni rafraîchissement", async () => {
    const calls = stubBack(SHOW);
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC1000" })).toEqual({ status: "success", outcome: "unchanged" });
    expect(writes(calls)).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("saison inexistante (404) : participantGone", async () => {
    stubBack({ "GET /api/saisons/4": { status: 404, body: loadFixture("season-show-404.json", D) } });
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC9" })).toEqual({ status: "error", message: SEASON_MESSAGES.participantGone });
  });

  it("lecture des inscrits en échec : message serveur, aucune écriture", async () => {
    const calls = stubBack({ "GET /api/saisons/4": { status: 500, body: {} } });
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC9" })).toEqual({ status: "error", message: ADMIN_MESSAGES.serverWrite });
    expect(writes(calls)).toHaveLength(0);
  });

  it("succès : un seul POST puis rafraîchissement des participants (sans palmarès)", async () => {
    const calls = stubBack({ ...SHOW, "POST /api/participer": { status: 201, body: loadFixture("participer-post-201.json", D) } });
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC1005" })).toEqual({ status: "success", outcome: "added" });
    expect(writes(calls)).toHaveLength(1);
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1005" });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season/[id]/edit", "page");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("422 (exists) : participantGone en français, aucun rafraîchissement", async () => {
    stubBack({ ...SHOW, "POST /api/participer": { status: 422, body: loadFixture("participer-post-422-exists.json", D) } });
    const result = await addSeasonParticipant({ seasonId: 4, licence: "LIC1005" });
    expect(result).toEqual({ status: "error", message: SEASON_MESSAGES.participantGone });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("500 : message serveur", async () => {
    stubBack({ ...SHOW, "POST /api/participer": { status: 500, body: {} } });
    expect(await addSeasonParticipant({ seasonId: 4, licence: "LIC1005" })).toEqual({ status: "error", message: ADMIN_MESSAGES.serverWrite });
  });
});

describe("removeSeasonParticipant", () => {
  it("succès : DELETE avec le couple dans le corps, sans lecture préalable, même si le joueur était absent", async () => {
    const calls = stubBack({ "DELETE /api/participer": loadFixture("participer-delete-200.json", D) });
    expect(await removeSeasonParticipant({ seasonId: 4, licence: "LIC1005" })).toEqual({ status: "success", outcome: "removed" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/participer" });
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1005" });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/player");
  });

  it("entrées invalides : aucun appel", async () => {
    const calls = stubBack({});
    expect(await removeSeasonParticipant({ seasonId: 0, licence: "LIC1" })).toEqual({ status: "error", message: SEASON_MESSAGES.participantGone });
    expect(await removeSeasonParticipant({ seasonId: 4, licence: "x/y" })).toEqual({ status: "error", message: SEASON_MESSAGES.participantGone });
    expect(calls).toHaveLength(0);
  });

  it("500 : message serveur, aucun rafraîchissement", async () => {
    stubBack({ "DELETE /api/participer": { status: 500, body: {} } });
    expect(await removeSeasonParticipant({ seasonId: 4, licence: "LIC1" })).toEqual({ status: "error", message: ADMIN_MESSAGES.serverWrite });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("réseau : message réseau", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await removeSeasonParticipant({ seasonId: 4, licence: "LIC1" })).toEqual({ status: "error", message: ADMIN_MESSAGES.networkWrite });
  });
});

describe("checkSeasonReferences", () => {
  const input = { startYear: 2026, endYear: 2027, championship: "R2", category: "S", teamId: 1 };

  it("ok, teamGone, duplicate, unavailable", async () => {
    stubBack(READS);
    expect(await checkSeasonReferences(input, "tok")).toEqual({ kind: "ok" });
    expect(await checkSeasonReferences({ ...input, teamId: 999 }, "tok")).toEqual({ kind: "teamGone" });
    expect(await checkSeasonReferences({ ...input, startYear: 2025, endYear: 2026, championship: "D1", category: "U15G" }, "tok")).toEqual({ kind: "duplicate" });
    expect(
      await checkSeasonReferences({ ...input, startYear: 2025, endYear: 2026, championship: "D1", category: "U15G" }, "tok", { excludeSeasonId: 4 }),
    ).toEqual({ kind: "ok" });
    stubBack({ ...READS, "GET /api/saisons": { status: 500, body: {} } });
    expect(await checkSeasonReferences(input, "tok")).toEqual({ kind: "unavailable" });
  });

  it("relance redirect() sur un 401 (session expirée) au lieu de répondre « indisponible »", async () => {
    stubBack({ "GET /api/equipes": { status: 401, body: {} }, "GET /api/saisons": saisons });
    await expect(checkSeasonReferences(input, "tok")).rejects.toThrow("REDIRECT:/session/expired");
  });
});
