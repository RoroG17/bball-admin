import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
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
  headers: async () => new Headers({ "x-bball-path": "/admin/user" }),
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

const { createAccount, deleteAccount, resetAccountPassword } = await import("@/actions/accountActions");

const users = loadFixture("users-200.json", "admin-user");
const historiques = loadFixture("users-200-historiques.json", "admin-user");
const joueurs = loadFixture("joueurs.json", "player");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const writes = (calls: FetchCall[]) => calls.filter((call) => call.method !== "GET");

/** Lectures servies par `reads` ; l'écriture `method` sur `path` répond `status` / `body` (échec réseau si `body` est `null`). */
function stubWrite(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  status: number,
  body: unknown,
  reads: Record<string, unknown> = { "/api/users": users, "/api/joueurs": joueurs },
): FetchCall[] {
  const calls = stubApi(reads);
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
  ["createAccount", () => createAccount(IDLE_FORM_STATE, form({ username: "nouveau", joueur: "" }))],
  ["resetAccountPassword", () => resetAccountPassword(IDLE_FORM_STATE, form({ username: "paul.durand" }))],
  ["deleteAccount", () => deleteAccount(IDLE_FORM_STATE, form({ username: "paul.durand" }))],
])("%s : garde", (_name, run) => {
  it("joueur : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubApi({ "/api/users": users });
    await expect(run()).resolves.toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("compte « Admin » (ambigu) : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "Admin", licence: null, token: "tok" }, SECRET);
    const calls = stubApi({ "/api/users": users });
    await expect(run()).resolves.toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });

  it("visiteur : redirigé vers la session expirée, aucun appel", async () => {
    jar.value = undefined;
    const calls = stubApi({});
    await expectRedirect(run(), "/session/expired?redirect=%2Fadmin%2Fuser");
    expect(calls).toHaveLength(0);
  });
});

describe("createAccount", () => {
  it.each([
    ["admin", ACCOUNT_MESSAGES.username.reserved],
    ["Admin", ACCOUNT_MESSAGES.username.reserved],
    ["ADMIN", ACCOUNT_MESSAGES.username.reserved],
    ["admin ", ACCOUNT_MESSAGES.username.badCharacters],
    [" admin", ACCOUNT_MESSAGES.username.badCharacters],
    ["", ACCOUNT_MESSAGES.username.required],
    ["paul durand", ACCOUNT_MESSAGES.username.badCharacters],
    ["a".repeat(65), ACCOUNT_MESSAGES.username.tooLong],
  ])("identifiant %j refusé sous le champ, aucun appel au back", async (username, message) => {
    const calls = stubApi({ "/api/users": users, "/api/joueurs": joueurs });
    const state = await createAccount(IDLE_FORM_STATE, form({ username, joueur: "LIC1002" }));
    expect(state).toMatchObject({
      status: "error",
      message: ADMIN_MESSAGES.fixFields,
      fieldErrors: { username: message },
      values: { username },
    });
    expect(calls).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("succès sans joueur : POST { username }, rafraîchissement, redirection avec la notice", async () => {
    const calls = stubWrite("POST", "/api/users", 201, loadFixture("user-create-201.json", "admin-user"));
    await expectRedirect(
      createAccount(IDLE_FORM_STATE, form({ username: "nouveau.compte", joueur: "" })),
      "/admin/user?notice=created&ref=nouveau.compte",
    );
    expect(calls.map((call) => call.method)).toEqual(["POST"]);
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({ username: "nouveau.compte" });
    expect(writes(calls)[0].headers.get("Authorization")).toBe("Bearer tok");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user/create");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("succès avec un joueur disponible : le joueur est envoyé (prêt pour B6)", async () => {
    const calls = stubWrite("POST", "/api/users", 201, loadFixture("user-create-201.json", "admin-user"));
    await expectRedirect(
      createAccount(IDLE_FORM_STATE, form({ username: "nouveau.compte", joueur: "LIC1002" })),
      "/admin/user?notice=created&ref=nouveau.compte",
    );
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({ username: "nouveau.compte", joueur: "LIC1002" });
  });

  it("joueur qui a déjà un compte : playerUnavailable, aucune écriture", async () => {
    const calls = stubWrite("POST", "/api/users", 201, {});
    const state = await createAccount(IDLE_FORM_STATE, form({ username: "autre", joueur: "LIC1001" }));
    expect(state).toMatchObject({ status: "error", message: ACCOUNT_MESSAGES.playerUnavailable });
    expect(writes(calls)).toHaveLength(0);
  });

  it("joueur inconnu ou licence invalide : playerUnavailable, aucune écriture", async () => {
    const calls = stubWrite("POST", "/api/users", 201, {});
    expect(await createAccount(IDLE_FORM_STATE, form({ username: "a", joueur: "ZZZ99" }))).toMatchObject({
      message: ACCOUNT_MESSAGES.playerUnavailable,
    });
    expect(await createAccount(IDLE_FORM_STATE, form({ username: "a", joueur: "a b" }))).toMatchObject({
      message: ACCOUNT_MESSAGES.playerUnavailable,
    });
    expect(writes(calls)).toHaveLength(0);
  });

  it("lecture des comptes impossible avec un joueur choisi : rien n'est écrit", async () => {
    const calls = stubWrite("POST", "/api/users", 201, {}, { "/api/joueurs": joueurs });
    const state = await createAccount(IDLE_FORM_STATE, form({ username: "a", joueur: "LIC1002" }));
    expect(state).toMatchObject({ status: "error", message: ADMIN_MESSAGES.serverWrite });
    expect(writes(calls)).toHaveLength(0);
  });

  it("identifiant déjà utilisé (422) : texte français sous le champ, jamais la phrase du back", async () => {
    stubWrite("POST", "/api/users", 422, loadFixture("user-create-422-taken.json", "admin-user"));
    const state = await createAccount(IDLE_FORM_STATE, form({ username: "paul.durand", joueur: "" }));
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { username: ACCOUNT_MESSAGES.username.taken },
      values: { username: "paul.durand" },
    });
    expect(JSON.stringify(state)).not.toContain("already been taken");
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("500 puis réseau : messages d'écriture, saisie conservée, pas de rafraîchissement", async () => {
    stubWrite("POST", "/api/users", 500, {});
    expect(await createAccount(IDLE_FORM_STATE, form({ username: "x", joueur: "" }))).toMatchObject({
      message: ADMIN_MESSAGES.serverWrite,
      values: { username: "x" },
    });
    vi.unstubAllGlobals();
    stubWrite("POST", "/api/users", 0, null);
    expect(await createAccount(IDLE_FORM_STATE, form({ username: "x", joueur: "" }))).toMatchObject({
      message: ADMIN_MESSAGES.networkWrite,
    });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
});

describe.each([
  ["resetAccountPassword", resetAccountPassword, "PUT" as const, "reset", ADMIN_MESSAGES.networkWrite],
  ["deleteAccount", deleteAccount, "DELETE" as const, "deleted", ADMIN_MESSAGES.deleteFailed],
])("%s : cible, protections et écriture", (_name, action, method, notice, networkMessage) => {
  it("succès : relecture fraîche, écriture sur le nom de la liste, rafraîchissement, redirection", async () => {
    const calls = stubWrite(method, "/api/users/paul.durand", 200, {});
    await expectRedirect(action(IDLE_FORM_STATE, form({ username: "paul.durand" })), `/admin/user?notice=${notice}`);
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["GET /api/users", `${method} /api/users/paul.durand`]);
    expect(writes(calls)[0].body).toBeNull();
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
  });

  it("le compte connecté est protégé : message, aucune écriture", async () => {
    const calls = stubWrite(method, "/api/users/admin", 200, {});
    const state = await action(IDLE_FORM_STATE, form({ username: "admin" }));
    expect(state).toMatchObject({ status: "error", message: ACCOUNT_MESSAGES.protection.self });
    expect(writes(calls)).toHaveLength(0);
  });

  it.each(["ADMIN", "Admin", "admin ", " admin", "admin​", "paul.durand "])(
    "cible forgée %j : absente de la liste (égalité stricte) → compte disparu, aucune écriture",
    async (forged) => {
      const calls = stubWrite(method, `/api/users/${encodeURIComponent(forged)}`, 200, {});
      const state = await action(IDLE_FORM_STATE, form({ username: forged }));
      expect(state).toMatchObject({ status: "error", message: ACCOUNT_MESSAGES.gone });
      expect(writes(calls)).toHaveLength(0);
      expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
    },
  );

  it("« Admin » (ambigu) présent dans la liste n'est pas protégé : l'action l'écrit sous son nom exact", async () => {
    const calls = stubWrite(method, "/api/users/Admin%20", 200, {}, { "/api/users": historiques });
    await expectRedirect(action(IDLE_FORM_STATE, form({ username: "Admin " })), `/admin/user?notice=${notice}`);
    expect(writes(calls).map((call) => call.path)).toEqual(["/api/users/Admin%20"]);
  });

  it("identifiant encodé dans le champ : décodé une seule fois, chemin ré-encodé", async () => {
    const calls = stubWrite(method, "/api/users/Jean%20Pierre.Martin", 200, {}, { "/api/users": historiques });
    await expectRedirect(action(IDLE_FORM_STATE, form({ username: "Jean%20Pierre.Martin" })), `/admin/user?notice=${notice}`);
    expect(writes(calls).map((call) => call.path)).toEqual(["/api/users/Jean%20Pierre.Martin"]);
  });

  it("lecture de la liste impossible : targetUnreadable, aucune écriture (échec fermé)", async () => {
    const calls = stubWrite(method, "/api/users/paul.durand", 200, {}, {});
    const state = await action(IDLE_FORM_STATE, form({ username: "paul.durand" }));
    expect(state).toMatchObject({ status: "error", message: ACCOUNT_MESSAGES.targetUnreadable });
    expect(writes(calls)).toHaveLength(0);
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });

  it("liste de format invalide : échec fermé", async () => {
    const calls = stubWrite(method, "/api/users/paul.durand", 200, {}, { "/api/users": loadFixture("users-200-invalid-flag.json", "admin-user") });
    const state = await action(IDLE_FORM_STATE, form({ username: "paul.durand" }));
    expect(state).toMatchObject({ message: ACCOUNT_MESSAGES.targetUnreadable });
    expect(writes(calls)).toHaveLength(0);
  });

  it.each([[""], ["a\u0000b"], ["a".repeat(256)]])("identifiant %j invalide : compte disparu, aucun appel", async (username) => {
    const calls = stubApi({ "/api/users": users });
    const state = await action(IDLE_FORM_STATE, form({ username }));
    expect(state).toMatchObject({ message: ACCOUNT_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });

  it("champ absent : compte disparu, aucun appel", async () => {
    const calls = stubApi({ "/api/users": users });
    expect(await action(IDLE_FORM_STATE, form({}))).toMatchObject({ message: ACCOUNT_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });

  it("404 à l'écriture : « Ce compte n'existe plus » et pages rafraîchies", async () => {
    stubWrite(method, "/api/users/paul.durand", 404, loadFixture("user-reset-404.json", "admin-user"));
    const state = await action(IDLE_FORM_STATE, form({ username: "paul.durand" }));
    expect(state).toMatchObject({ status: "error", message: ACCOUNT_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
  });

  it("réseau : message d'échec de l'action, pas de rafraîchissement", async () => {
    stubWrite(method, "/api/users/paul.durand", 0, null);
    const state = await action(IDLE_FORM_STATE, form({ username: "paul.durand" }));
    expect(state).toMatchObject({ status: "error", message: networkMessage });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("messages d'échec propres à chaque action", () => {
  it("500 à la suppression : deleteFailed", async () => {
    stubWrite("DELETE", "/api/users/paul.durand", 500, {});
    expect(await deleteAccount(IDLE_FORM_STATE, form({ username: "paul.durand" }))).toMatchObject({
      message: ADMIN_MESSAGES.deleteFailed,
    });
  });

  it("500 à la réinitialisation : serverWrite", async () => {
    stubWrite("PUT", "/api/users/paul.durand", 500, {});
    expect(await resetAccountPassword(IDLE_FORM_STATE, form({ username: "paul.durand" }))).toMatchObject({
      message: ADMIN_MESSAGES.serverWrite,
    });
  });

  it("la réinitialisation n'invalide pas le palmarès", async () => {
    stubWrite("PUT", "/api/users/paul.durand", 200, {});
    await expect(resetAccountPassword(IDLE_FORM_STATE, form({ username: "paul.durand" }))).rejects.toThrow("REDIRECT");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
});
