import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticate, setPassword } from "@/repositories/AuthRepository";
import { loadFixture, stubApi } from "../helpers";

const fixture = (name: string) => loadFixture(name, "auth");
const connect = (status: number, file: string) => ({ "/connect": { status, body: fixture(file) } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AuthRepository.authenticate", () => {
  it("200 joueur : identité canonique du back et jeton", async () => {
    stubApi(connect(200, "connect-200-joueur.json"));
    await expect(authenticate("Theo.Bernard", "secret")).resolves.toEqual({
      kind: "authenticated",
      user: { username: "theo.bernard", licence: "LIC1000" },
      token: "2|fixturePlayerTokenFixturePlayerToken",
    });
  });

  it("200 admin : licence null", async () => {
    stubApi(connect(200, "connect-200-admin.json"));
    await expect(authenticate("admin", "secret")).resolves.toMatchObject({
      kind: "authenticated",
      user: { username: "admin", licence: null },
    });
  });

  it("200 avec une licence vide : null", async () => {
    stubApi({ "/connect": { status: 200, body: { user: { username: "a", joueur: "  " }, token: "t" } } });
    await expect(authenticate("a", "b")).resolves.toMatchObject({ user: { licence: null } });
  });

  it.each([["connect-200-sans-token.json"], ["connect-200-access-token.json"]])(
    "200 au format invalide (%s) : service indisponible",
    async (file) => {
      stubApi(connect(200, file));
      await expect(authenticate("admin", "secret")).resolves.toEqual({ kind: "unavailable" });
    },
  );

  it("201 : mot de passe à initialiser", async () => {
    stubApi(connect(201, "connect-201.json"));
    await expect(authenticate("theo.bernard")).resolves.toEqual({ kind: "passwordNotSet" });
  });

  it.each([
    [400, "connect-400.json"],
    [401, "connect-401.json"],
    [404, "connect-404.json"],
  ])("%i : même résultat « identifiants invalides »", async (status, file) => {
    stubApi(connect(status, file));
    await expect(authenticate("admin", "x")).resolves.toEqual({ kind: "invalidCredentials" });
  });

  it("429 : trop de tentatives", async () => {
    stubApi({ "/connect": { status: 429, body: { message: "Too Many Attempts." } } });
    await expect(authenticate("admin", "x")).resolves.toEqual({ kind: "tooManyAttempts" });
  });

  it.each([
    [422, fixture("connect-422.json")],
    [500, { message: "Server Error" }],
  ])("%i : service indisponible", async (status, body) => {
    stubApi({ "/connect": { status, body } });
    await expect(authenticate("admin", "x")).resolves.toEqual({ kind: "unavailable" });
  });

  it("corps HTML : service indisponible", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    await expect(authenticate("admin", "x")).resolves.toEqual({ kind: "unavailable" });
  });

  it("erreur réseau ou délai dépassé : service indisponible, sans exception", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("timeout", "TimeoutError"))));
    await expect(authenticate("admin", "x")).resolves.toEqual({ kind: "unavailable" });
  });

  it("n'envoie pas de mot de passe s'il n'est pas fourni, et n'appelle pas le cookie CSRF", async () => {
    const bodies: unknown[] = [];
    const calls = stubApi(connect(201, "connect-201.json"));
    const fetchMock = vi.mocked(fetch);
    await authenticate("theo.bernard");
    bodies.push(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)));
    expect(bodies[0]).toEqual({ username: "theo.bernard" });
    expect(calls.map((call) => call.path)).toEqual(["/connect"]);
  });
});

describe("AuthRepository.setPassword", () => {
  it("200 : ok", async () => {
    stubApi({ "/update": { status: 200, body: fixture("update-200.json") } });
    await expect(setPassword("theo.bernard", "abcdefgh")).resolves.toEqual({ kind: "ok" });
  });

  it("404 : compte introuvable", async () => {
    stubApi({ "/update": { status: 404, body: fixture("update-404.json") } });
    await expect(setPassword("x", "abcdefgh")).resolves.toEqual({ kind: "notFound" });
  });

  it("422 : message du champ password", async () => {
    stubApi({ "/update": { status: 422, body: fixture("update-422.json") } });
    await expect(setPassword("x", "")).resolves.toEqual({
      kind: "invalid",
      message: "The password field is required.",
    });
  });

  it("422 sans message exploitable : message null", async () => {
    stubApi({ "/update": { status: 422, body: { message: "x", errors: { username: ["y"] } } } });
    await expect(setPassword("x", "y")).resolves.toEqual({ kind: "invalid", message: null });
  });

  it("500 et réseau : indisponible", async () => {
    stubApi({ "/update": { status: 500, body: {} } });
    await expect(setPassword("x", "abcdefgh")).resolves.toEqual({ kind: "unavailable" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(setPassword("x", "abcdefgh")).resolves.toEqual({ kind: "unavailable" });
  });
});
