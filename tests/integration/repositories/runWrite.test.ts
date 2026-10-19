import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/ApiError";
import { apiDelete, apiPost } from "@/lib/http";
import { stubApi } from "../helpers";

/** Erreur de contrôle de flux de Next (redirect / forbidden / notFound), identifiable par `unstable_rethrow`. */
class NextControlError extends Error {}

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-bball-path": "/admin/team" }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
  forbidden: () => {
    throw new NextControlError("FORBIDDEN");
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof NextControlError) throw error;
  },
}));

const { runWrite } = await import("@/repositories/support/runWrite");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runWrite : succès", () => {
  it("200 → ok avec la valeur brute", async () => {
    stubApi({ "/api/equipes": { status: 201, body: { id: 5 } } });
    await expect(runWrite(() => apiPost("/api/equipes", {}, { token: "t" }))).resolves.toEqual({
      kind: "ok",
      value: { id: 5 },
    });
  });

  it("2xx sans corps → ok avec undefined (R-ECR-1)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(runWrite(() => apiDelete("/api/equipes/5", { token: "t" }))).resolves.toEqual({
      kind: "ok",
      value: undefined,
    });
  });
});

describe("runWrite : échecs du back", () => {
  it("422 valide → invalid avec les erreurs par champ", async () => {
    const errors = { nom: ["The nom has already been taken."] };
    stubApi({ "/api/equipes": { status: 422, body: { message: "The given data was invalid.", errors } } });
    await expect(runWrite(() => apiPost("/api/equipes", {}, { token: "t" }))).resolves.toEqual({
      kind: "invalid",
      errors,
    });
  });

  it("422 au corps illisible → failed/server", async () => {
    stubApi({ "/api/equipes": { status: 422, body: { oops: true } } });
    await expect(runWrite(() => apiPost("/api/equipes", {}, { token: "t" }))).resolves.toEqual({
      kind: "failed",
      reason: "server",
    });
  });

  it("404 avec message → notFound et message du back conservé (non affiché)", async () => {
    stubApi({ "/api/equipes/9": { status: 404, body: { message: "Équipe non trouvée" } } });
    await expect(runWrite(() => apiDelete("/api/equipes/9", { token: "t" }))).resolves.toEqual({
      kind: "notFound",
      backMessage: "Équipe non trouvée",
    });
  });

  it("404 sans message exploitable → backMessage null", async () => {
    stubApi({ "/api/equipes/9": { status: 404, body: { message: 12 } } });
    await expect(runWrite(() => apiDelete("/api/equipes/9", { token: "t" }))).resolves.toEqual({
      kind: "notFound",
      backMessage: null,
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Not found", { status: 404 })));
    await expect(runWrite(() => apiDelete("/api/equipes/9", { token: "t" }))).resolves.toEqual({
      kind: "notFound",
      backMessage: null,
    });
  });

  it.each([
    [403, { kind: "forbidden" }],
    [409, { kind: "conflict" }],
    [500, { kind: "failed", reason: "server" }],
    [400, { kind: "failed", reason: "server" }],
    [429, { kind: "failed", reason: "server" }],
  ])("%s → %j", async (status, expected) => {
    stubApi({ "/api/x": { status, body: { message: "x" } } });
    await expect(runWrite(() => apiPost("/api/x", {}, { token: "t" }))).resolves.toEqual(expected);
  });
});

describe("runWrite : réseau et délai", () => {
  it("rejet réseau → failed/network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(runWrite(() => apiPost("/api/x", {}, { token: "t" }))).resolves.toEqual({
      kind: "failed",
      reason: "network",
    });
  });

  it("délai dépassé → failed/network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("timeout", "TimeoutError"))));
    await expect(runWrite(() => apiPost("/api/x", {}, { token: "t" }))).resolves.toEqual({
      kind: "failed",
      reason: "network",
    });
  });
});

describe("runWrite : contrôle de flux de Next", () => {
  it("relance la redirection « session expirée » d'un 401 (jamais avalée)", async () => {
    stubApi({ "/api/x": { status: 401, body: {} } });
    await expect(runWrite(() => apiPost("/api/x", {}, { token: "t" }))).rejects.toThrow(
      "REDIRECT:/session/expired?redirect=%2Fadmin%2Fteam",
    );
  });

  it("relance redirect() et forbidden() levés par l'appel", async () => {
    await expect(
      runWrite(async () => {
        throw new NextControlError("REDIRECT:/login");
      }),
    ).rejects.toThrow("REDIRECT:/login");
    await expect(
      runWrite(async () => {
        throw new NextControlError("FORBIDDEN");
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("runWrite : aucune fuite", () => {
  it("le résultat d'un échec ne contient ni jeton ni charge utile", async () => {
    stubApi({ "/api/x": { status: 500, body: { message: "boom" } } });
    const result = await runWrite(() => apiPost("/api/x", { password: "s3cret" }, { token: "tok-secret" }));
    expect(JSON.stringify(result)).not.toMatch(/s3cret|tok-secret/);
  });

  it("n'enveloppe pas une ApiError de plus : elle est classée, pas relancée", async () => {
    const result = await runWrite(async () => {
      throw new ApiError(500, "/api/x");
    });
    expect(result).toEqual({ kind: "failed", reason: "server" });
  });
});
