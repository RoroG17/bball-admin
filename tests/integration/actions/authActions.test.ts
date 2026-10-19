import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signActivationToken } from "@/lib/activationToken";
import { signSessionToken } from "@/lib/sessionToken";
import type { InitPasswordState } from "@/models/InitPasswordState";
import type { LoginState } from "@/models/LoginState";
import { loadFixture } from "../helpers";

const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  deletes: [] as string[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.values.has(name) ? { name, value: jar.values.get(name)! } : undefined),
    has: (name: string) => jar.values.has(name),
    set: (name: string, value: string) => {
      jar.values.set(name, value);
    },
    delete: (name: string) => {
      jar.deletes.push(name);
      jar.values.delete(name);
    },
  }),
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  forbidden: () => {
    throw new Error("FORBIDDEN");
  },
}));

const { login, initPassword, logout } = await import("@/actions/authActions");
const { getCurrentSession } = await import("@/repositories/SessionRepository");

const SECRET = process.env.SESSION_SECRET!;
const IDLE_LOGIN: LoginState = { status: "idle" };
const IDLE_INIT: InitPasswordState = { status: "idle" };

type Reply = { status: number; body: unknown };
type Call = { path: string; body: Record<string, unknown> };

/** Faux back : chaque appel consomme la réponse suivante prévue pour la route. */
function stubBack(replies: Record<string, Reply[]>): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      calls.push({ path, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
      const reply = replies[path]?.shift();
      if (!reply) return new Response("Not found", { status: 404 });
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return calls;
}

const fixture = (name: string) => loadFixture(name, "auth");
const reply = (status: number, file: string): Reply => ({ status, body: fixture(file) });

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

beforeEach(() => {
  jar.values.clear();
  jar.deletes = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("succès : crée la session avec l'identité du back puis redirige vers la page demandée", async () => {
    stubBack({ "/connect": [reply(200, "connect-200-joueur.json")] });
    await expect(
      login(IDLE_LOGIN, form({ username: "Theo.Bernard", password: "secret", redirect: "/game?saison=4" })),
    ).rejects.toThrow("REDIRECT:/game?saison=4");
    await expect(getCurrentSession()).resolves.toMatchObject({
      username: "theo.bernard",
      licence: "LIC1000",
      role: "player",
    });
  });

  it("succès : une redirection dangereuse renvoie à l'accueil", async () => {
    stubBack({ "/connect": [reply(200, "connect-200-admin.json")] });
    await expect(login(IDLE_LOGIN, form({ username: "admin", password: "x", redirect: "//evil.com" }))).rejects.toThrow(
      /^REDIRECT:\/$/,
    );
  });

  it("201 : pose le cookie d'activation et va sur /init-password, sans identifiant dans l'URL", async () => {
    stubBack({ "/connect": [reply(201, "connect-201.json")] });
    await expect(login(IDLE_LOGIN, form({ username: "theo.bernard", password: "", redirect: "/game" }))).rejects.toThrow(
      "REDIRECT:/init-password?redirect=%2Fgame",
    );
    expect(jar.values.has("bball_activation")).toBe(true);
    expect(jar.values.has("bball_session")).toBe(false);
  });

  it.each([
    [400, "connect-400.json"],
    [401, "connect-401.json"],
    [404, "connect-404.json"],
  ])("%i : message unique, identifiant conservé, jamais le mot de passe", async (status, file) => {
    stubBack({ "/connect": [reply(status, file)] });
    const state = await login(IDLE_LOGIN, form({ username: "admin", password: "secret" }));
    expect(state).toEqual({
      status: "error",
      reason: "invalidCredentials",
      message: "Identifiant ou mot de passe incorrect.",
      fieldErrors: {},
      values: { username: "admin" },
    });
    expect(JSON.stringify(state)).not.toContain("secret");
  });

  it("panne : message de service et session existante intacte (P6)", async () => {
    const existing = await signSessionToken({ username: "admin", licence: null, token: "t" }, SECRET);
    jar.values.set("bball_session", existing);
    stubBack({ "/connect": [{ status: 500, body: {} }] });
    const state = await login(IDLE_LOGIN, form({ username: "admin", password: "x" }));
    expect(state).toMatchObject({ status: "error", reason: "unavailable" });
    expect(jar.values.get("bball_session")).toBe(existing);
  });

  it("identifiant vide : erreur de champ, sans appel réseau", async () => {
    const calls = stubBack({});
    const state = await login(IDLE_LOGIN, form({ username: "  ", password: "" }));
    expect(state).toMatchObject({
      status: "error",
      reason: "invalidInput",
      fieldErrors: { username: "Saisis ton identifiant." },
    });
    expect(calls).toHaveLength(0);
  });
});

describe("initPassword", () => {
  const validForm = (extra: Record<string, string> = {}) =>
    form({ password: "Tr0ubadour-84", confirmation: "Tr0ubadour-84", ...extra });

  async function activate(username = "theo.bernard") {
    jar.values.set("bball_activation", await signActivationToken(username, SECRET));
  }

  it("sans cookie d'activation : retour au login, aucun appel /update (P2)", async () => {
    const calls = stubBack({});
    await expect(initPassword(IDLE_INIT, validForm())).rejects.toThrow("REDIRECT:/login?reason=activation-expired");
    expect(calls).toHaveLength(0);
  });

  it("ignore un identifiant forgé dans le formulaire", async () => {
    await activate("theo.bernard");
    const calls = stubBack({
      "/connect": [reply(201, "connect-201.json"), reply(200, "connect-200-joueur.json")],
      "/update": [reply(200, "update-200.json")],
    });
    await expect(initPassword(IDLE_INIT, validForm({ username: "admin" }))).rejects.toThrow("REDIRECT:/");
    expect(calls.every((call) => call.body.username === "theo.bernard")).toBe(true);
  });

  it("succès : recontrôle, écrit, se reconnecte automatiquement (D3)", async () => {
    await activate();
    const calls = stubBack({
      "/connect": [reply(201, "connect-201.json"), reply(200, "connect-200-joueur.json")],
      "/update": [reply(200, "update-200.json")],
    });
    await expect(initPassword(IDLE_INIT, validForm({ redirect: "/game" }))).rejects.toThrow("REDIRECT:/game");
    expect(calls.map((call) => call.path)).toEqual(["/connect", "/update", "/connect"]);
    expect(calls[0].body).toEqual({ username: "theo.bernard" });
    expect(jar.values.has("bball_activation")).toBe(false);
    await expect(getCurrentSession()).resolves.toMatchObject({ username: "theo.bernard" });
  });

  it("compte qui a déjà un mot de passe : aucun appel /update (P2)", async () => {
    await activate("admin");
    const calls = stubBack({ "/connect": [reply(400, "connect-400.json")] });
    await expect(initPassword(IDLE_INIT, validForm())).rejects.toThrow("REDIRECT:/login?reason=already-active");
    expect(calls.map((call) => call.path)).toEqual(["/connect"]);
    expect(jar.values.has("bball_activation")).toBe(false);
  });

  it("règle de mot de passe : erreurs de champ, aucun appel réseau", async () => {
    await activate();
    const calls = stubBack({});
    const state = await initPassword(IDLE_INIT, form({ password: "court", confirmation: "autre" }));
    expect(state).toEqual({
      status: "error",
      message: null,
      fieldErrors: { password: "Le mot de passe doit contenir au moins 8 caractères." },
    });
    expect(calls).toHaveLength(0);
  });

  it("422 du back : message du back", async () => {
    await activate();
    stubBack({ "/connect": [reply(201, "connect-201.json")], "/update": [reply(422, "update-422.json")] });
    await expect(initPassword(IDLE_INIT, validForm())).resolves.toEqual({
      status: "error",
      message: "The password field is required.",
      fieldErrors: {},
    });
  });

  it("panne réseau : message de service, activation conservée", async () => {
    await activate();
    stubBack({ "/connect": [reply(201, "connect-201.json")], "/update": [{ status: 500, body: {} }] });
    await expect(initPassword(IDLE_INIT, validForm())).resolves.toMatchObject({
      message: "Impossible de définir le mot de passe pour le moment. Réessaie dans un instant.",
    });
    expect(jar.values.has("bball_activation")).toBe(true);
  });

  it("échec de la reconnexion automatique : login avec « mot de passe défini »", async () => {
    await activate();
    stubBack({
      "/connect": [reply(201, "connect-201.json"), { status: 500, body: {} }],
      "/update": [reply(200, "update-200.json")],
    });
    await expect(initPassword(IDLE_INIT, validForm())).rejects.toThrow("REDIRECT:/login?reason=password-set");
  });

  it("double soumission : la seconde ne rappelle pas /update", async () => {
    await activate();
    const calls = stubBack({
      "/connect": [reply(201, "connect-201.json"), reply(200, "connect-200-joueur.json")],
      "/update": [reply(200, "update-200.json")],
    });
    await initPassword(IDLE_INIT, validForm()).catch(() => undefined);
    await expect(initPassword(IDLE_INIT, validForm())).rejects.toThrow("REDIRECT:/login?reason=activation-expired");
    expect(calls.filter((call) => call.path === "/update")).toHaveLength(1);
  });
});

describe("logout", () => {
  it("supprime les deux cookies et renvoie au login, même sans session", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(jar.deletes).toEqual(["bball_session", "bball_activation"]);
  });
});
