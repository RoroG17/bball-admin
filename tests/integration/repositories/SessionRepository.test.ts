import { beforeEach, describe, expect, it, vi } from "vitest";
import { signActivationToken } from "@/lib/activationToken";
import { signSessionToken } from "@/lib/sessionToken";

type CookieOptions = Record<string, unknown>;

const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: [] as { name: string; value: string; options: CookieOptions }[],
  deletes: [] as string[],
  path: null as string | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.values.has(name) ? { name, value: jar.values.get(name)! } : undefined),
    has: (name: string) => jar.values.has(name),
    set: (name: string, value: string, options: CookieOptions) => {
      jar.sets.push({ name, value, options });
      jar.values.set(name, value);
    },
    delete: (name: string) => {
      jar.deletes.push(name);
      jar.values.delete(name);
    },
  }),
  headers: async () => new Headers(jar.path ? { "x-bball-path": jar.path } : {}),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  forbidden: () => {
    throw new Error("FORBIDDEN");
  },
}));

const { getCurrentSession, createSession, destroySession, requireSession, requirePermission, requireAdmin } = await import(
  "@/repositories/SessionRepository"
);
const { startActivation, getPendingActivation, endActivation } = await import("@/repositories/ActivationRepository");

const SECRET = process.env.SESSION_SECRET!;

beforeEach(() => {
  jar.values.clear();
  jar.sets = [];
  jar.deletes = [];
  jar.path = null;
});

describe("SessionRepository.getCurrentSession", () => {
  it("lit un cookie valide et déduit le rôle joueur", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET));
    await expect(getCurrentSession()).resolves.toEqual({
      username: "lucas",
      licence: "LIC1000",
      role: "player",
      token: "tok",
    });
  });

  it("déduit le rôle admin pour le compte admin sans licence", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET));
    await expect(getCurrentSession()).resolves.toMatchObject({ role: "admin" });
  });

  it("un autre compte sans licence est joueur (D1)", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "coach", licence: null, token: "tok" }, SECRET));
    await expect(getCurrentSession()).resolves.toMatchObject({ role: "player", licence: null });
  });

  it("renvoie null sans cookie", async () => {
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("renvoie null pour un cookie signé avec un autre secret", async () => {
    jar.values.set(
      "bball_session",
      await signSessionToken({ username: "admin", licence: null, token: "tok" }, "un-autre-secret-un-autre-secret-un-autre"),
    );
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("renvoie null pour un cookie modifié", async () => {
    const token = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ username: "admin", licence: null, token: "tok" })).toString(
      "base64url",
    );
    jar.values.set("bball_session", `${header}.${forgedPayload}.${signature}`);
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("renvoie null pour un cookie expiré", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "lucas", licence: null, token: "tok" }, SECRET, -10));
    await expect(getCurrentSession()).resolves.toBeNull();
  });

  it("refuse un jeton d'activation comme session", async () => {
    jar.values.set("bball_session", await signActivationToken("admin", SECRET));
    await expect(getCurrentSession()).resolves.toBeNull();
  });
});

describe("SessionRepository.createSession / destroySession", () => {
  it("pose un cookie HttpOnly, Lax, 7 jours, relisible", async () => {
    await createSession({ username: "lucas", licence: "LIC1000" }, "tok");
    expect(jar.sets).toHaveLength(1);
    expect(jar.sets[0]).toMatchObject({
      name: "bball_session",
      options: { httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800, secure: false },
    });
    await expect(getCurrentSession()).resolves.toMatchObject({ username: "lucas", token: "tok" });
  });

  it("supprime la session et l'activation", async () => {
    await destroySession();
    expect(jar.deletes).toEqual(["bball_session", "bball_activation"]);
  });
});

describe("SessionRepository.requireSession", () => {
  it("renvoie la session si elle est valide", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET));
    await expect(requireSession()).resolves.toMatchObject({ username: "lucas" });
  });

  it("sans cookie : connexion avec la page demandée, sans raison", async () => {
    jar.path = "/game?saison=4";
    await expect(requireSession()).rejects.toThrow("REDIRECT:/login?redirect=%2Fgame%3Fsaison%3D4");
  });

  it("cookie invalide : connexion avec « session expirée »", async () => {
    jar.path = "/game";
    jar.values.set("bball_session", "falsifié");
    await expect(requireSession()).rejects.toThrow("REDIRECT:/login?reason=expired&redirect=%2Fgame");
  });

  it("re-assainit le chemin lu dans l'en-tête", async () => {
    jar.path = "//evil.com";
    await expect(requireSession()).rejects.toThrow(/^REDIRECT:\/login$/);
  });
});

describe("SessionRepository.requirePermission", () => {
  it("un joueur obtient « Accès refusé »", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET));
    await expect(requirePermission("accessAdmin")).rejects.toThrow("FORBIDDEN");
  });

  it("l'admin passe", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET));
    await expect(requirePermission("accessAdmin")).resolves.toMatchObject({ role: "admin" });
  });

  it("sans session : connexion", async () => {
    await expect(requirePermission("accessAdmin")).rejects.toThrow(/^REDIRECT:\/login/);
  });
});

describe("SessionRepository.requireAdmin", () => {
  it("un joueur obtient « Accès refusé »", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET));
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("un compte « Admin » (casse différente) est un joueur", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "Admin", licence: null, token: "tok" }, SECRET));
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("l'admin obtient sa session", async () => {
    jar.values.set("bball_session", await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET));
    await expect(requireAdmin()).resolves.toMatchObject({ role: "admin", token: "tok" });
  });

  it("sans session : connexion avec la page demandée", async () => {
    jar.path = "/admin/player";
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login?redirect=%2Fadmin%2Fplayer");
  });
});

describe("ActivationRepository", () => {
  it("aller-retour, cookie de 15 minutes", async () => {
    await startActivation("theo.bernard");
    expect(jar.sets[0]).toMatchObject({ name: "bball_activation", options: { httpOnly: true, maxAge: 900 } });
    await expect(getPendingActivation()).resolves.toEqual({ username: "theo.bernard" });
  });

  it("refuse un jeton expiré, falsifié ou de session", async () => {
    jar.values.set("bball_activation", await signActivationToken("theo.bernard", SECRET, -10));
    await expect(getPendingActivation()).resolves.toBeNull();
    jar.values.set("bball_activation", "falsifié");
    await expect(getPendingActivation()).resolves.toBeNull();
    jar.values.set("bball_activation", await signSessionToken({ username: "admin", licence: null, token: "t" }, SECRET));
    await expect(getPendingActivation()).resolves.toBeNull();
  });

  it("endActivation supprime le cookie", async () => {
    await endActivation();
    expect(jar.deletes).toEqual(["bball_activation"]);
  });
});
