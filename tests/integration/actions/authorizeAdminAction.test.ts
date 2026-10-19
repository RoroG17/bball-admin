import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { stubApi } from "../helpers";

const SECRET = "test-secret-test-secret-test-secret-0123";
const jar = vi.hoisted(() => ({ value: undefined as string | undefined, path: "/admin/team" }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && jar.value ? { name, value: jar.value } : undefined),
    has: (name: string) => name === "bball_session" && jar.value !== undefined,
  }),
  headers: async () => new Headers({ "x-bball-path": jar.path }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { authorizeAdminAction } = await import("@/actions/support/authorizeAdminAction");

beforeEach(() => {
  jar.value = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authorizeAdminAction", () => {
  it("sans cookie : redirection « session expirée » avec la page en cours", async () => {
    await expect(authorizeAdminAction()).rejects.toThrow("REDIRECT:/session/expired?redirect=%2Fadmin%2Fteam");
  });

  it("cookie falsifié : même redirection", async () => {
    jar.value = "falsifié";
    await expect(authorizeAdminAction()).rejects.toThrow(/^REDIRECT:\/session\/expired/);
  });

  it("joueur : refusé, sans aucun appel au back", async () => {
    const calls = stubApi({});
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    await expect(authorizeAdminAction()).resolves.toEqual({ ok: false, message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });

  it("compte sans licence qui n'est pas admin : refusé", async () => {
    jar.value = await signSessionToken({ username: "Admin ", licence: null, token: "tok" }, SECRET);
    await expect(authorizeAdminAction()).resolves.toMatchObject({ ok: false });
  });

  it("admin : autorisé avec sa session", async () => {
    jar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET);
    await expect(authorizeAdminAction()).resolves.toEqual({
      ok: true,
      session: { username: "admin", licence: null, role: "admin", token: "tok" },
    });
  });
});
