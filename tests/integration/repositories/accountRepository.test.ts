import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import { loadFixture, stubApi } from "../helpers";

class NextControlError extends Error {}

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof NextControlError) throw error;
  },
}));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { createAccount, deleteAccount, listAccounts, listAccountsFresh, resetAccountPassword } = await import(
  "@/repositories/AccountRepository"
);
const { listAccountLicences } = await import("@/repositories/UserRepository");

const fixture = <T = unknown>(name: string) => loadFixture<T>(name, "admin-user");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listAccounts", () => {
  it("fixture nominale : correspondance, rôle, licence rognée, équipe nulle conservée", async () => {
    const calls = stubApi({ "/api/users": fixture("users-200.json") });
    const accounts = await listAccounts("tok");
    expect(accounts).toHaveLength(6);
    expect(accounts[0]).toEqual({ username: "admin", player: null, teamName: null, hasPassword: true, role: "admin" });
    expect(accounts[2]).toEqual({
      username: "paul.durand",
      player: { licence: "LIC1001", firstName: "Paul", lastName: "DURAND" },
      teamName: "FAC Basket",
      hasPassword: false,
      role: "player",
    });
    expect(accounts[4]).toMatchObject({ username: "sans.equipe", teamName: null, player: { licence: "LIC9000" } });
    expect(accounts[5]).toMatchObject({ username: "compte.sans.joueur", player: null, role: "player" });
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("l'identifiant est recopié sans rognage ni changement de casse ; « Admin » n'est pas admin", async () => {
    stubApi({ "/api/users": fixture("users-200-historiques.json") });
    const accounts = await listAccounts("tok");
    expect(accounts.map((account) => account.username)).toEqual(["admin", "Jean Pierre.Martin", "Admin ", "paul.durand"]);
    expect(accounts.map((account) => account.role)).toEqual(["admin", "player", "player", "player"]);
  });

  it("licence blanche → pas de joueur ; licence rognée", async () => {
    stubApi({
      "/api/users": {
        users: [
          { username: "a", joueur: "  ", nom: null, prenom: null, equipe: null, has_password: 1 },
          { username: "b", joueur: " LIC1 ", nom: null, prenom: null, equipe: null, has_password: 1 },
        ],
      },
    });
    const accounts = await listAccounts("tok");
    expect(accounts[0].player).toBeNull();
    expect(accounts[1].player).toEqual({ licence: "LIC1", firstName: "", lastName: "" });
  });

  it.each([
    [0, false],
    [1, true],
    ["0", false],
    ["1", true],
  ])("has_password %j → %s (jamais la vérité JS)", async (flag, expected) => {
    stubApi({
      "/api/users": { users: [{ username: "p", joueur: null, nom: null, prenom: null, equipe: null, has_password: flag }] },
    });
    expect((await listAccounts("tok"))[0].hasPassword).toBe(expected);
  });

  it("chaînes « 0 » / « 1 » de la fixture", async () => {
    stubApi({ "/api/users": fixture("users-200-string-flags.json") });
    const accounts = await listAccounts("tok");
    expect(accounts.map((account) => account.hasPassword)).toEqual([true, false, true]);
  });

  it.each([2, "2", "", null, true, "oui", 0.5])("has_password %j → lève", async (flag) => {
    stubApi({
      "/api/users": { users: [{ username: "p", joueur: null, nom: null, prenom: null, equipe: null, has_password: flag }] },
    });
    await expect(listAccounts("tok")).rejects.toBeInstanceOf(ZodError);
  });

  it("fixtures invalides : flag 2 et forme inattendue lèvent", async () => {
    stubApi({ "/api/users": fixture("users-200-invalid-flag.json") });
    await expect(listAccounts("tok")).rejects.toBeInstanceOf(ZodError);
    stubApi({ "/api/users": fixture("users-200-invalid-shape.json") });
    await expect(listAccounts("tok")).rejects.toBeInstanceOf(ZodError);
  });

  it("liste vide", async () => {
    stubApi({ "/api/users": fixture("users-200-empty.json") });
    expect(await listAccounts("tok")).toEqual([]);
  });

  it("500 → lève ApiError", async () => {
    stubApi({ "/api/users": { status: 500, body: { message: "Server Error" } } });
    await expect(listAccounts("tok")).rejects.toBeInstanceOf(ApiError);
  });

  it("listAccountsFresh lit la même route avec le jeton", async () => {
    const calls = stubApi({ "/api/users": fixture("users-200.json") });
    expect(await listAccountsFresh("tok")).toHaveLength(6);
    expect(calls.map((call) => call.path)).toEqual(["/api/users"]);
  });
});

describe("isolation des tranches de GET /api/users (C5)", () => {
  it("un format de compte invalide ne casse pas la liste des licences", async () => {
    // `has_password: 2` : invalide pour les comptes, sans effet sur la liste blanche des licences.
    stubApi({ "/api/users": fixture("users-200-invalid-flag.json") });
    await expect(listAccounts("tok")).rejects.toBeInstanceOf(ZodError);
    expect(await listAccountLicences("tok")).toEqual(["LIC1001"]);
  });

  it("les trois repositories lisent la même route", async () => {
    const calls = stubApi({ "/api/users": fixture("users-200.json") });
    await listAccounts("tok");
    await listAccountLicences("tok");
    expect(new Set(calls.map((call) => call.path))).toEqual(new Set(["/api/users"]));
  });
});

describe("createAccount", () => {
  it("sans joueur : corps { username } seul, jeton, linked null", async () => {
    const calls = stubApi({ "/api/users": { status: 201, body: fixture("user-create-201.json") } });
    const result = await createAccount({ username: "nouveau.compte", licence: null }, "tok");
    expect(result).toEqual({ kind: "ok", value: { username: "nouveau.compte", linked: null } });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/users" });
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ username: "nouveau.compte" });
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("avec joueur : { username, joueur } ; réponse sans joueur (B6) → linked false", async () => {
    const calls = stubApi({ "/api/users": { status: 201, body: fixture("user-create-201.json") } });
    const result = await createAccount({ username: "nouveau.compte", licence: "LIC1002" }, "tok");
    expect(JSON.parse(calls[0].body ?? "")).toEqual({ username: "nouveau.compte", joueur: "LIC1002" });
    expect(result).toEqual({ kind: "ok", value: { username: "nouveau.compte", linked: false } });
  });

  it("réponse avec le joueur (B6 livré) → linked true", async () => {
    stubApi({ "/api/users": { status: 201, body: fixture("user-create-201-linked.json") } });
    const result = await createAccount({ username: "nouveau.compte", licence: "LIC1002" }, "tok");
    expect(result).toEqual({ kind: "ok", value: { username: "nouveau.compte", linked: true } });
  });

  it("201 au corps illisible → ok, linked null, identifiant demandé", async () => {
    stubApi({ "/api/users": { status: 201, body: "illisible" } });
    expect(await createAccount({ username: "x", licence: "LIC1" }, "tok")).toEqual({
      kind: "ok",
      value: { username: "x", linked: null },
    });
  });

  it("422 taken → invalid (champ username)", async () => {
    stubApi({ "/api/users": { status: 422, body: fixture("user-create-422-taken.json") } });
    expect(await createAccount({ username: "paul", licence: null }, "tok")).toEqual({
      kind: "invalid",
      errors: { username: ["The username has already been taken."] },
    });
  });

  it("500 → failed/server ; réseau → failed/network", async () => {
    stubApi({ "/api/users": { status: 500, body: { message: "Server Error" } } });
    expect(await createAccount({ username: "x", licence: null }, "tok")).toEqual({ kind: "failed", reason: "server" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await createAccount({ username: "x", licence: null }, "tok")).toEqual({ kind: "failed", reason: "network" });
  });
});

describe("resetAccountPassword / deleteAccount", () => {
  it("PUT sans corps ni Content-Type, identifiant encodé", async () => {
    const calls = stubApi({ "/api/users/Jean%20Pierre.Martin": fixture("user-reset-200.json") });
    expect(await resetAccountPassword("Jean Pierre.Martin", "tok")).toEqual({ kind: "ok", value: null });
    expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/users/Jean%20Pierre.Martin", body: null });
    expect(calls[0].headers.has("Content-Type")).toBe(false);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
  });

  it("DELETE sans corps, identifiant encodé", async () => {
    const calls = stubApi({ "/api/users/Jean%20Pierre.Martin": fixture("user-delete-200.json") });
    expect(await deleteAccount("Jean Pierre.Martin", "tok")).toEqual({ kind: "ok", value: null });
    expect(calls[0]).toMatchObject({ method: "DELETE", path: "/api/users/Jean%20Pierre.Martin", body: null });
    expect(calls[0].headers.has("Content-Type")).toBe(false);
  });

  it("un identifiant avec « / » ou « ? » ne sort pas du segment", async () => {
    const calls = stubApi({});
    await deleteAccount("a/b?c", "tok");
    expect(calls[0].path).toBe("/api/users/a%2Fb%3Fc");
  });

  it("404 → notFound", async () => {
    stubApi({ "/api/users/paul": { status: 404, body: fixture("user-reset-404.json") } });
    expect(await resetAccountPassword("paul", "tok")).toEqual({ kind: "notFound", backMessage: "Utilisateur non trouvé" });
    expect(await deleteAccount("paul", "tok")).toMatchObject({ kind: "notFound" });
  });

  it("500 → failed/server ; réseau → failed/network", async () => {
    stubApi({ "/api/users/paul": { status: 500, body: {} } });
    expect(await resetAccountPassword("paul", "tok")).toEqual({ kind: "failed", reason: "server" });
    expect(await deleteAccount("paul", "tok")).toEqual({ kind: "failed", reason: "server" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await deleteAccount("paul", "tok")).toEqual({ kind: "failed", reason: "network" });
  });
});
