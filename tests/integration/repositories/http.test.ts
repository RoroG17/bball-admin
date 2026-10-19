import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/ApiError";
import { apiDelete, apiGet, apiPost, apiPostWithStatus, apiPut } from "@/lib/http";
import { buildMediaUrl } from "@/lib/mediaUrl";
import { stubApi } from "../helpers";

const request = vi.hoisted(() => ({ path: null as string | null }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(request.path ? { "x-bball-path": request.path } : {}),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  request.path = null;
});

describe("401 : session refusée par le back", () => {
  it("avec jeton : redirige vers /session/expired avec la page en cours", async () => {
    request.path = "/game?saison=4";
    stubApi({ "/api/matchs": { status: 401, body: { message: "Unauthenticated." } } });
    await expect(apiGet("/api/matchs", { token: "tok" })).rejects.toThrow(
      "REDIRECT:/session/expired?redirect=%2Fgame%3Fsaison%3D4",
    );
  });

  it("apiPost avec jeton : même redirection", async () => {
    stubApi({ "/api/physics": { status: 401, body: {} } });
    await expect(apiPost("/api/physics", {}, { token: "tok" })).rejects.toThrow("REDIRECT:/session/expired?redirect=%2F");
  });

  it("sans jeton : ApiError, pas de redirection", async () => {
    stubApi({ "/api/matchs": { status: 401, body: {} } });
    await expect(apiGet("/api/matchs")).rejects.toMatchObject({ status: 401 });
  });

  it("un 500 ne déconnecte jamais (P6)", async () => {
    stubApi({ "/api/matchs": { status: 500, body: {} } });
    await expect(apiGet("/api/matchs", { token: "tok" })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("apiPostWithStatus", () => {
  it("ne lève pas sur un statut d'erreur et renvoie le corps", async () => {
    const calls = stubApi({ "/connect": { status: 401, body: { message: "Mot de passe incorrect" } } });
    await expect(apiPostWithStatus("/connect", { username: "a" })).resolves.toEqual({
      status: 401,
      body: { message: "Mot de passe incorrect" },
    });
    expect(calls[0].headers.get("Authorization")).toBeNull();
    expect(calls[0].headers.get("Accept")).toBe("application/json");
  });

  it("accepte un corps non JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 500 })));
    await expect(apiPostWithStatus("/connect", {})).resolves.toEqual({ status: 500, body: undefined });
  });

  it("lève sur une erreur réseau", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(apiPostWithStatus("/connect", {})).rejects.toThrow("fetch failed");
  });
});

describe("apiGet", () => {
  it("lève une ApiError si le back répond en erreur", async () => {
    stubApi({ "/accueil/4": { status: 500, body: { message: "boom" } } });
    const error = await apiGet("/accueil/4").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("envoie le token en Bearer s'il est fourni", async () => {
    const calls = stubApi({ "/api/saisons": [] });
    await apiGet("/api/saisons", { token: "abc" });
    await apiGet("/api/saisons");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer abc");
    expect(calls[1].headers.get("Authorization")).toBeNull();
  });
});

describe("apiGet : cache opt-in", () => {
  function captureInit() {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    return () => (fetchMock.mock.calls[0] as unknown as [unknown, RequestInit])[1];
  }

  it("reste en no-store sans option de cache", async () => {
    const init = captureInit();
    await apiGet("/api/saisons");
    expect(init()).toMatchObject({ cache: "no-store" });
    expect(init().next).toBeUndefined();
  });

  it("passe en force-cache avec revalidate et tags quand la durée est positive", async () => {
    const init = captureInit();
    await apiGet("/api/history", { token: "abc", revalidate: { seconds: 300, tags: ["hall-of-fame"] } });
    expect(init()).toMatchObject({ cache: "force-cache", next: { revalidate: 300, tags: ["hall-of-fame"] } });
  });

  it("désactive le cache quand la durée est 0 (jamais revalidate avec no-store)", async () => {
    const init = captureInit();
    await apiGet("/api/history", { revalidate: { seconds: 0, tags: ["hall-of-fame"] } });
    expect(init()).toMatchObject({ cache: "no-store" });
    expect(init().next).toBeUndefined();
  });
});

describe("apiPost", () => {
  it("envoie du JSON authentifié et demande une réponse JSON", async () => {
    const calls = stubApi({ "/api/physics": { status: 201, body: { id: "1" } } });
    await expect(apiPost("/api/physics", { value: 1 }, { token: "abc" })).resolves.toEqual({ id: "1" });
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer abc");
  });

  it("lève une ApiError avec le corps d'un 422", async () => {
    const body = { message: "invalide", errors: { value: ["invalide"] } };
    stubApi({ "/api/physics": { status: 422, body } });
    const error = await apiPost("/api/physics", {}, { token: "abc" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, body });
  });
});

describe.each([
  ["apiPost", "POST", (path: string, body: unknown) => apiPost(path, body, { token: "abc" })],
  ["apiPut", "PUT", (path: string, body: unknown) => apiPut(path, body, { token: "abc" })],
  ["apiDelete", "DELETE", (path: string, body: unknown) => apiDelete(path, { token: "abc", body })],
] as const)("%s : écriture JSON", (_name, method, send) => {
  it("utilise la bonne méthode, le Bearer et Accept JSON, sans cache", async () => {
    const calls = stubApi({ "/api/equipes/3": { status: 200, body: { id: 3 } } });
    await expect(send("/api/equipes/3", { name: "RPB" })).resolves.toEqual({ id: 3 });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe(method);
    expect(calls[0].headers.get("Authorization")).toBe("Bearer abc");
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
    expect(calls[0].body).toBe(JSON.stringify({ name: "RPB" }));
  });

  it("n'appelle jamais /sanctum/csrf-cookie", async () => {
    const calls = stubApi({ "/api/equipes": { status: 201, body: {} } });
    await send("/api/equipes", {});
    expect(calls.map((c) => c.path)).toEqual(["/api/equipes"]);
  });

  it("2xx sans corps ou non JSON → undefined, sans erreur", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    await expect(send("/api/x", {})).resolves.toBeUndefined();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("OK", { status: 200 })));
    await expect(send("/api/x", {})).resolves.toBeUndefined();
  });

  it("401 avec jeton → redirection /session/expired", async () => {
    request.path = "/admin/team";
    stubApi({ "/api/x": { status: 401, body: {} } });
    await expect(send("/api/x", {})).rejects.toThrow("REDIRECT:/session/expired?redirect=%2Fadmin%2Fteam");
  });

  it("422 → ApiError avec le corps de validation", async () => {
    const body = { message: "invalide", errors: { nom: ["The nom field is required."] } };
    stubApi({ "/api/x": { status: 422, body } });
    const error = await send("/api/x", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, path: "/api/x", body });
  });

  it("5xx au corps illisible → ApiError sans corps, pas de déconnexion", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 500 })));
    const error = await send("/api/x", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, body: undefined });
  });

  it("applique un délai de 10 s et laisse passer le rejet par délai", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const calls = stubApi({ "/api/x": {} });
    await send("/api/x", {});
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("timeout", "TimeoutError"))));
    await expect(send("/api/x", {})).rejects.toMatchObject({ name: "TimeoutError" });
  });
});

describe("apiDelete", () => {
  it("sans corps : pas de Content-Type ni de corps", async () => {
    const calls = stubApi({ "/api/equipes/3": { body: { message: "supprimé" } } });
    await expect(apiDelete("/api/equipes/3", { token: "abc" })).resolves.toEqual({ message: "supprimé" });
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].headers.get("Content-Type")).toBeNull();
    expect(calls[0].body).toBeNull();
  });

  it("avec un corps JSON (DELETE /api/participer)", async () => {
    const calls = stubApi({ "/api/participer": { body: { message: "ok" } } });
    await apiDelete("/api/participer", { token: "abc", body: { Id_Saison: 4, licence: "LIC1" } });
    expect(calls[0].headers.get("Content-Type")).toBe("application/json");
    expect(calls[0].body).toBe(JSON.stringify({ Id_Saison: 4, licence: "LIC1" }));
  });
});

describe("buildMediaUrl", () => {
  it("construit l'URL des médias à partir de BBALL_API_URL", () => {
    expect(buildMediaUrl("logo", "logo otb.png")).toBe("http://api.test/public/images/logo/logo%20otb.png");
    expect(buildMediaUrl("joueur", "")).toBeNull();
    expect(buildMediaUrl("joueur", null)).toBeNull();
  });
});
