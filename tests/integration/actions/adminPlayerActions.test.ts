import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { loadFixture, stubApi, type FetchCall } from "../helpers";

class RedirectError extends Error {}

const SECRET = "test-secret-test-secret-test-secret-0123";
const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && jar.value ? { name, value: jar.value } : undefined),
    has: (name: string) => name === "bball_session" && jar.value !== undefined,
  }),
  headers: async () => new Headers({ "x-bball-path": "/admin/player" }),
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

const { createPlayer, deletePlayer, enrollPlayer, updatePlayer } = await import("@/actions/adminPlayerActions");

const equipes = loadFixture<unknown[]>("equipes.json", "admin-team");
const saisons = loadFixture("saisons-admin.json", "home");
const saisonsJoueur = loadFixture("saisons-joueur-LIC2000.json", "player");

const VALID = {
  licence: "ab 12",
  lastName: " Durand ",
  firstName: "Paul",
  civility: "M",
  birthDate: "2011-03-12",
  photo: "",
  teamId: "3",
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const writes = (calls: FetchCall[]) => calls.filter((call) => call.method !== "GET");

/** Lectures servies normalement ; l'écriture `method` sur `path` répond `status` / `body` (ou un échec réseau si `body` est `null`). */
function stubWrite(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  status: number,
  body: unknown,
  reads: Record<string, unknown> = {},
): FetchCall[] {
  const calls = stubApi({ "/api/equipes": equipes, "/api/saisons": saisons, ...reads });
  const mock = vi.mocked(fetch);
  const base = mock.getMockImplementation()!;
  mock.mockImplementation(async (input, init) => {
    const response = await base(input, init);
    if (init?.method !== method || new URL(String(input)).pathname !== path) return response;
    if (body === null) throw new TypeError("fetch failed");
    return new Response(JSON.stringify(body), { status });
  });
  return calls;
}

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

describe.each([
  ["createPlayer", () => createPlayer(IDLE_FORM_STATE, form(VALID))],
  ["updatePlayer", () => updatePlayer(IDLE_FORM_STATE, form(VALID))],
  ["deletePlayer", () => deletePlayer(IDLE_FORM_STATE, form({ licence: "AB12" }))],
  ["enrollPlayer", () => enrollPlayer(IDLE_FORM_STATE, form({ licence: "AB12", seasonId: "4" }))],
])("%s : garde", (_name, run) => {
  it("joueur : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubApi({ "/api/equipes": equipes });
    await expect(run()).resolves.toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("visiteur : redirigé vers la session expirée, aucun appel", async () => {
    jar.value = undefined;
    const calls = stubApi({});
    await expectRedirect(run(), "/session/expired?redirect=%2Fadmin%2Fplayer");
    expect(calls).toHaveLength(0);
  });
});

describe("createPlayer", () => {
  it("champs invalides : erreurs de champ, saisie conservée, aucun appel", async () => {
    const calls = stubApi({ "/api/equipes": equipes });
    const state = await createPlayer(
      IDLE_FORM_STATE,
      form({ ...VALID, licence: "ABCDEFGHI", lastName: " ", civility: "m", birthDate: "2999-01-01", teamId: "0", photo: "a/b.png" }),
    );
    expect(state).toMatchObject({
      status: "error",
      message: ADMIN_MESSAGES.fixFields,
      fieldErrors: {
        licence: ADMIN_PLAYER_MESSAGES.licenceInvalid,
        lastName: ADMIN_PLAYER_MESSAGES.lastNameRequired,
        civility: ADMIN_PLAYER_MESSAGES.civilityRequired,
        birthDate: ADMIN_PLAYER_MESSAGES.birthDateFuture,
        teamId: ADMIN_PLAYER_MESSAGES.teamRequired,
        photo: ADMIN_PLAYER_MESSAGES.photoInvalid,
      },
      values: { licence: "ABCDEFGHI", firstName: "Paul" },
    });
    expect(calls).toHaveLength(0);
  });

  it("succès : POST normalisé, rafraîchissement sans palmarès, redirection vers /created", async () => {
    const calls = stubWrite("POST", "/api/joueurs", 201, loadFixture("joueur-cree-201.json", "admin-player"));
    await expectRedirect(createPlayer(IDLE_FORM_STATE, form(VALID)), "/admin/player/AB12/created");
    const [write] = writes(calls);
    expect(JSON.parse(write.body ?? "")).toEqual({
      licence: "AB12",
      nom: "Durand",
      prenom: "Paul",
      civilite: "M",
      date_naissance: "2011-03-12",
      equipe: 3,
      photo: null,
    });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/player");
    expect(cache.updateTag).not.toHaveBeenCalled();
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user/create");
    expect(writes(calls)).toHaveLength(1);
  });

  it("licence déjà utilisée (422) : message français sur le champ, jamais la phrase du back", async () => {
    stubWrite("POST", "/api/joueurs", 422, loadFixture("creation-422-licence.json", "admin-player"));
    const state = await createPlayer(IDLE_FORM_STATE, form(VALID));
    expect(state).toMatchObject({ status: "error", fieldErrors: { licence: ADMIN_PLAYER_MESSAGES.licenceTaken } });
    expect(JSON.stringify(state)).not.toContain("already been taken");
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("équipe absente de la liste : erreur sur le champ, aucun POST", async () => {
    const calls = stubWrite("POST", "/api/joueurs", 201, {});
    const state = await createPlayer(IDLE_FORM_STATE, form({ ...VALID, teamId: "999" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { teamId: ADMIN_PLAYER_MESSAGES.teamGone } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("liste des équipes illisible : on écrit quand même, le back tranche", async () => {
    const calls = stubWrite("POST", "/api/joueurs", 201, {}, {});
    vi.mocked(fetch).mockImplementationOnce(async () => new Response("{}", { status: 500 }));
    await expectRedirect(createPlayer(IDLE_FORM_STATE, form(VALID)), "/admin/player/AB12/created");
    expect(writes(calls)).toHaveLength(1);
  });

  it.each([
    ["500", 500, {}],
    ["réseau", 0, null],
  ])("échec serveur (%s) : message « peut-être créé sans son compte », saisie conservée, pas de rafraîchissement", async (_label, status, body) => {
    stubWrite("POST", "/api/joueurs", status, body);
    const state = await createPlayer(IDLE_FORM_STATE, form(VALID));
    expect(state).toMatchObject({
      status: "error",
      message: ADMIN_PLAYER_MESSAGES.createMaybePartial,
      values: { licence: "ab 12", lastName: " Durand " },
    });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updatePlayer", () => {
  it("succès : PUT sans licence, palmarès invalidé, retour liste avec la notice", async () => {
    const calls = stubWrite("PUT", "/api/joueurs/AB12", 200, loadFixture("update-200.json", "admin-player"));
    await expectRedirect(
      updatePlayer(IDLE_FORM_STATE, form({ ...VALID, photo: "durand.png" })),
      "/admin/player?notice=updated&ref=AB12",
    );
    const [write] = writes(calls);
    expect(write.path).toBe("/api/joueurs/AB12");
    expect(JSON.parse(write.body ?? "")).toEqual({
      nom: "Durand",
      prenom: "Paul",
      civilite: "M",
      date_naissance: "2011-03-12",
      photo: "durand.png",
      Id_Equipe: 3,
    });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/player");
    expect(cache.updateTag).toHaveBeenCalledWith("hall-of-fame");
  });

  it("champs invalides : aucun appel", async () => {
    const calls = stubApi({ "/api/equipes": equipes });
    const state = await updatePlayer(IDLE_FORM_STATE, form({ ...VALID, firstName: "" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { firstName: ADMIN_PLAYER_MESSAGES.firstNameRequired } });
    expect(calls).toHaveLength(0);
  });

  it("équipe absente : erreur de champ, aucun PUT", async () => {
    const calls = stubWrite("PUT", "/api/joueurs/AB12", 200, {});
    const state = await updatePlayer(IDLE_FORM_STATE, form({ ...VALID, teamId: "999" }));
    expect(state).toMatchObject({ fieldErrors: { teamId: ADMIN_PLAYER_MESSAGES.teamGone } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("404 : « Ce joueur n'existe plus. » et rafraîchissement (la ligne fantôme disparaît)", async () => {
    stubWrite("PUT", "/api/joueurs/AB12", 404, loadFixture("update-404.json", "admin-player"));
    const state = await updatePlayer(IDLE_FORM_STATE, form(VALID));
    expect(state).toMatchObject({ status: "error", message: ADMIN_PLAYER_MESSAGES.playerGone });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/player");
    expect(cache.updateTag).toHaveBeenCalledWith("hall-of-fame");
  });

  it("500 : message serveur, ni rafraîchissement ni palmarès", async () => {
    stubWrite("PUT", "/api/joueurs/AB12", 500, {});
    const state = await updatePlayer(IDLE_FORM_STATE, form(VALID));
    expect(state).toMatchObject({ status: "error", message: ADMIN_MESSAGES.serverWrite });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
});

describe("deletePlayer", () => {
  it("licence invalide : « n'existe plus », aucun appel", async () => {
    const calls = stubApi({});
    for (const licence of ["", "A B", "ABCDEFGHI", "../x"]) {
      await expect(deletePlayer(IDLE_FORM_STATE, form({ licence }))).resolves.toMatchObject({
        status: "error",
        message: ADMIN_MESSAGES.gone,
      });
    }
    expect(calls).toHaveLength(0);
  });

  it("succès : un seul DELETE, palmarès invalidé, retour liste avec la notice", async () => {
    const calls = stubWrite("DELETE", "/api/joueurs/LIC1", 200, loadFixture("delete-200.json", "admin-player"));
    await expectRedirect(deletePlayer(IDLE_FORM_STATE, form({ licence: "LIC1" })), "/admin/player?notice=deleted");
    expect(calls.map((call) => call.method)).toEqual(["DELETE"]);
    expect(cache.updateTag).toHaveBeenCalledWith("hall-of-fame");
    // C3 : la liste des comptes et le sélecteur de joueurs de la création de compte sont rafraîchis.
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user/create");
  });

  it("404 : « n'existe plus » et rafraîchissement", async () => {
    stubWrite("DELETE", "/api/joueurs/LIC1", 404, {});
    await expect(deletePlayer(IDLE_FORM_STATE, form({ licence: "LIC1" }))).resolves.toMatchObject({
      message: ADMIN_MESSAGES.gone,
    });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/player");
    expect(cache.updateTag).toHaveBeenCalledWith("hall-of-fame");
  });

  it("500 : deleteFailed, aucun rafraîchissement ni palmarès", async () => {
    stubWrite("DELETE", "/api/joueurs/LIC1", 500, loadFixture("delete-500-stats.json", "admin-player"));
    await expect(deletePlayer(IDLE_FORM_STATE, form({ licence: "LIC1" }))).resolves.toMatchObject({
      message: ADMIN_MESSAGES.deleteFailed,
    });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
});

describe("enrollPlayer", () => {
  const reads = { "/saisons/LIC1": saisonsJoueur };
  const withSeasons = (extra: Record<string, unknown> = {}) => ({ "/saisons/LIC1": [], ...extra });

  it("champs cachés invalides : « n'existe plus », aucun appel", async () => {
    const calls = stubApi({});
    for (const fields of <Record<string, string>[]>[{ licence: "A B", seasonId: "4" }, { licence: "LIC1", seasonId: "0" }, { licence: "LIC1", seasonId: "x" }, {}]) {
      await expect(enrollPlayer(IDLE_FORM_STATE, form(fields))).resolves.toMatchObject({ message: ADMIN_MESSAGES.gone });
    }
    expect(calls).toHaveLength(0);
  });

  it("déjà inscrit : aucun POST (idempotent), redirection", async () => {
    const calls = stubWrite("POST", "/api/participer", 201, {}, reads);
    await expectRedirect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "4" })), "/admin/player/LIC1/created");
    expect(writes(calls)).toHaveLength(0);
  });

  it("saison inconnue : seasonGone, aucun POST", async () => {
    const calls = stubWrite("POST", "/api/participer", 201, {}, withSeasons());
    await expect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "99" }))).resolves.toMatchObject({
      message: ADMIN_PLAYER_MESSAGES.seasonGone,
    });
    expect(writes(calls)).toHaveLength(0);
  });

  it("succès : un POST, rafraîchissement des effectifs sans palmarès, retour sur /created", async () => {
    const calls = stubWrite("POST", "/api/participer", 201, loadFixture("participer-201.json", "admin-player"), withSeasons());
    await expectRedirect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "4" })), "/admin/player/LIC1/created");
    const [write] = writes(calls);
    expect(write.path).toBe("/api/participer");
    expect(JSON.parse(write.body ?? "")).toEqual({ Id_Saison: 4, licence: "LIC1" });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("lecture des inscriptions en échec : message dédié, aucun POST", async () => {
    const calls = stubWrite("POST", "/api/participer", 201, {}, { "/saisons/LIC1": { status: 500, body: {} } });
    await expect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "4" }))).resolves.toMatchObject({
      message: ADMIN_PLAYER_MESSAGES.enrollmentUnavailable,
    });
    expect(writes(calls)).toHaveLength(0);
  });

  it("422 / 500 : message français, aucun rafraîchissement", async () => {
    stubWrite("POST", "/api/participer", 422, loadFixture("participer-422.json", "admin-player"), withSeasons());
    await expect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "4" }))).resolves.toMatchObject({
      status: "error",
      message: ADMIN_MESSAGES.rejected,
    });
    stubWrite("POST", "/api/participer", 500, {}, withSeasons());
    await expect(enrollPlayer(IDLE_FORM_STATE, form({ licence: "LIC1", seasonId: "4" }))).resolves.toMatchObject({
      message: ADMIN_MESSAGES.serverWrite,
    });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
});
