import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "@/lib/ApiError";
import { LOG_BACK_SUPPORT } from "@/models/LogBackSupport";
import type { LogListQuery } from "@/models/LogListQuery";
import { LOG_BACK_SUPPORT_ALL } from "@/models/resolveLogBackSupport";
import type { Session } from "@/models/Session";
import { loadFixture, stubApi } from "../helpers";

class NextControlError extends Error {}

const session = vi.hoisted(() => ({ current: null as Session | null }));
const memos = vi.hoisted(() => [] as Map<string, unknown>[]);

vi.mock("next/navigation", () => ({
  forbidden: () => {
    throw new NextControlError("FORBIDDEN");
  },
  redirect: (url: string) => {
    throw new NextControlError(`REDIRECT:${url}`);
  },
}));
vi.mock("@/repositories/SessionRepository", () => ({ getCurrentSession: async () => session.current }));
vi.mock("@/lib/redirectToSessionExpired", () => ({
  redirectToSessionExpired: async () => {
    throw new NextControlError("REDIRECT:/session/expired");
  },
}));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : on le remplace par une mémoïsation sur arguments
// primitifs, ce qui vérifie que la table et le détail appellent la source avec la MÊME clé (un seul appel HTTP).
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
    const memo = new Map<string, R>();
    memos.push(memo);
    return (...args: A): R => {
      const key = JSON.stringify(args);
      if (!memo.has(key)) memo.set(key, fn(...args));
      return memo.get(key) as R;
    };
  },
}));

const { listErrorLogs, listRequestLogs } = await import("@/repositories/LogRepository");
const { buildLogBackSearch } = await import("@/repositories/support/buildLogBackSearch");

const fixture = <T = unknown>(name: string) => loadFixture<T>(name, "admin-logs");

const ADMIN: Session = { username: "admin", licence: null, token: "tok-admin", role: "admin" };
const PLAYER: Session = { username: "lucas", licence: "LIC1000", token: "tok-player", role: "player" };
const BASE: LogListQuery = { kind: "errors", filters: {}, page: 1, detailId: null };
const REQUESTS: LogListQuery = { kind: "requests", filters: {}, page: 1, detailId: null };

type Row = Record<string, unknown>;

beforeEach(() => {
  for (const memo of memos) memo.clear();
  session.current = ADMIN;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listErrorLogs", () => {
  it("fixture nominale : Page, champs mappés, liens du back jamais exposés", async () => {
    stubApi({ "/api/logs/errors": fixture("errors-page-1.json") });
    const page = await listErrorLogs(BASE);
    expect(page).toMatchObject({ page: 1, pageCount: 3, total: 134, perPage: 50 });
    expect(page.items).toHaveLength(50);
    expect(page.items[0]).toEqual({
      id: 1900,
      occurredAt: "2026-10-12T12:02:11.000000Z",
      source: "server",
      statusCode: 500,
      message: "Server Error",
      route: "/api/matchs/52",
      method: "GET",
      user: { id: 4, username: "theo.bernard" },
      platform: "mobile",
      os: "iOS 17",
      context: null,
      position: null,
    });
    expect(page.items[1]).toMatchObject({ source: "client", statusCode: null, method: "POST" });
    expect(page.items[1].context).toEqual({ url: "https://api.example.invalid/api/matchs/52", retries: 2 });
    expect(Object.keys(page)).toEqual(["items", "page", "pageCount", "total", "perPage"]);
    expect(JSON.stringify(page)).not.toContain("first_page_url");
    expect(JSON.stringify(page)).not.toContain("localhost:8000");
  });

  it("utilisateur nul = anonyme ; position renseignée seulement si les deux coordonnées le sont", async () => {
    stubApi({ "/api/logs/errors": fixture("errors-page-1.json") });
    const page = await listErrorLogs(BASE);
    expect(page.items[2].user).toBeNull();
    expect(page.items[5].position).toEqual({ latitude: 43.60452, longitude: 1.44338 });
  });

  it("une seule coordonnée → position nulle", async () => {
    const body = fixture<{ data: Row[] }>("errors-page-1.json");
    body.data[0].latitude = 43.6;
    body.data[0].longitude = null;
    stubApi({ "/api/logs/errors": body });
    expect((await listErrorLogs(BASE)).items[0].position).toBeNull();
  });

  it("page vide : items vides, pageCount 1", async () => {
    stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    expect(await listErrorLogs(BASE)).toEqual({ items: [], page: 1, pageCount: 1, total: 0, perPage: 50 });
  });

  it("hors plage : items vides mais total > 0", async () => {
    stubApi({ "/api/logs/errors": fixture("errors-out-of-range.json") });
    const page = await listErrorLogs({ ...BASE, page: 999 });
    expect(page.items).toEqual([]);
    expect(page).toMatchObject({ page: 999, total: 134, pageCount: 3 });
  });

  it("contenu hostile : le message est intact (l'assainissement se fait à l'affichage)", async () => {
    stubApi({ "/api/logs/errors": fixture("errors-hostile.json") });
    const page = await listErrorLogs(BASE);
    expect(page.items[0].message).toContain("<script>alert(1)</script>");
    expect(page.items[0].message).toContain("‮");
    expect(page.items[0].message).toContain("\u0007");
    expect(page.items[0].user?.username).toBe("<img src=x onerror=alert(1)>");
    expect(page.items[1].message.length).toBeGreaterThan(29_000);
    expect(page.items[1].context).toEqual(["a", "b", { c: 1 }]);
  });

  it("nombres en chaînes numériques tolérés pour id, user_id et la pagination (jamais coerce)", async () => {
    const body = fixture<Record<string, unknown> & { data: Row[] }>("errors-page-1.json");
    body.data = [{ ...body.data[0], id: "77", user_id: "4", user: { id: "4", username: "theo.bernard" } }];
    body.total = "134";
    stubApi({ "/api/logs/errors": body });
    const page = await listErrorLogs(BASE);
    expect(page.items[0]).toMatchObject({ id: 77, user: { id: 4 } });
    expect(page.total).toBe(134);
  });

  describe("format invalide : rejette, jamais une liste vide trompeuse", () => {
    it("source inconnue", async () => {
      stubApi({ "/api/logs/errors": fixture("errors-invalid-source.json") });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });

    it("created_at non ISO", async () => {
      const body = fixture<{ data: Row[] }>("errors-page-1.json");
      body.data[3].created_at = "12/10/2026 14:02:11";
      stubApi({ "/api/logs/errors": body });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });

    it("created_at avec décalage horaire (le DTO exige l'UTC)", async () => {
      const body = fixture<{ data: Row[] }>("errors-page-1.json");
      body.data[0].created_at = "2026-10-12T14:02:11+02:00";
      stubApi({ "/api/logs/errors": body });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });

    it("data qui n'est pas un tableau", async () => {
      const body = fixture<Record<string, unknown>>("errors-page-1.json");
      body.data = { 0: {} };
      stubApi({ "/api/logs/errors": body });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });

    it("une seule ligne invalide fait échouer toute la page", async () => {
      const body = fixture<{ data: Row[] }>("errors-page-1.json");
      body.data[49].message = null;
      stubApi({ "/api/logs/errors": body });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });

    it("enveloppe de pagination absente", async () => {
      stubApi({ "/api/logs/errors": { data: [] } });
      await expect(listErrorLogs(BASE)).rejects.toBeInstanceOf(ZodError);
    });
  });

  it("refuse une requête d'un autre type, sans appel", async () => {
    const calls = stubApi({});
    await expect(listErrorLogs(REQUESTS)).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("isolation : une erreur de format n'affecte pas un second appel valide (autre requête)", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = new URL(String(input));
        calls.push(url.search);
        const body = url.searchParams.get("os") === "bad" ? fixture("errors-invalid-source.json") : fixture("errors-empty.json");
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    await expect(listErrorLogs({ ...BASE, filters: { os: "bad" } })).rejects.toBeInstanceOf(ZodError);
    await expect(listErrorLogs({ ...BASE, filters: { os: "ok" } })).resolves.toMatchObject({ total: 0 });
    expect(calls).toHaveLength(2);
  });
});

describe("appel HTTP", () => {
  it("URL, jeton, Accept : per_page=50 toujours présent, aucun cache Next", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    await listErrorLogs(BASE);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("GET");
    expect(calls[0].path).toBe("/api/logs/errors");
    expect(calls[0].search).toBe("?per_page=50&page=1");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer tok-admin");
    expect(calls[0].headers.get("Accept")).toBe("application/json");
    expect(calls[0].cache).toBe("no-store");
    expect(calls[0].next).toBeNull();
  });

  it("la V2 n'envoie ni GPS ni en-têtes X-Client-* ni X-Forwarded-For", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    await listErrorLogs({ ...BASE, filters: { plateforme: "web", os: "ios", source: "client" }, page: 2 });
    const names = [...calls[0].headers.keys()];
    expect(names.filter((name) => name.startsWith("x-"))).toEqual([]);
    expect(names.sort()).toEqual(["accept", "authorization"]);
    expect(calls[0].search).not.toMatch(/latitude|longitude|gps/i);
    expect(calls[0].body).toBeNull();
  });

  it("filtres actifs transmis (plateforme → platform), autres jamais émis", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    await listErrorLogs({
      ...BASE,
      filters: { plateforme: "mobile", os: "Android", source: "server", route: "/api", utilisateur: "lucas", statut: "5xx", du: "2026-10-12" },
      page: 2,
    });
    expect(calls[0].search).toBe("?per_page=50&page=2&platform=mobile&os=Android&source=server");
  });

  it("un `per_page` ne vient jamais de la page : la requête n'en porte pas", () => {
    expect(buildLogBackSearch({ ...BASE, filters: {} })).toBe("per_page=50&page=1");
  });

  it("un seul appel par rendu : la table et le détail partagent la lecture", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-page-1.json") });
    const table = await listErrorLogs({ ...BASE, page: 2, detailId: null });
    const detail = await listErrorLogs({ ...BASE, page: 2, detailId: 1853 });
    expect(calls).toHaveLength(1);
    expect(table.items).toEqual(detail.items);
  });

  it("deux requêtes différentes → deux appels", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    await listErrorLogs({ ...BASE, page: 1 });
    await listErrorLogs({ ...BASE, page: 2 });
    expect(calls).toHaveLength(2);
  });
});

describe("accès", () => {
  it("sans session : rejette sans aucun fetch", async () => {
    session.current = null;
    const calls = stubApi({});
    await expect(listErrorLogs(BASE)).rejects.toThrow("Session absente");
    expect(calls).toHaveLength(0);
  });

  it("session joueur : forbidden() relancé, zéro fetch", async () => {
    session.current = PLAYER;
    const calls = stubApi({ "/api/logs/errors": fixture("errors-page-1.json") });
    await expect(listErrorLogs(BASE)).rejects.toThrow("FORBIDDEN");
    expect(calls).toHaveLength(0);
  });

  it("administrateur : lecture autorisée", async () => {
    const calls = stubApi({ "/api/logs/errors": fixture("errors-empty.json") });
    await expect(listErrorLogs(BASE)).resolves.toBeDefined();
    expect(calls).toHaveLength(1);
  });
});

describe("erreurs HTTP : propagées, jamais une page vide", () => {
  it("401 avec jeton → retour à la session expirée (comportement d'apiGet)", async () => {
    stubApi({ "/api/logs/errors": { status: 401, body: { message: "Unauthenticated." } } });
    await expect(listErrorLogs(BASE)).rejects.toThrow("REDIRECT:/session/expired");
  });

  for (const status of [403, 404, 500]) {
    it(`${status} → ApiError propagée`, async () => {
      stubApi({ "/api/logs/errors": { status, body: { message: "x" } } });
      const error = await listErrorLogs(BASE).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(status);
    });
  }

  it("rejet réseau → propagé", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(listErrorLogs(BASE)).rejects.toThrow("fetch failed");
  });
});

describe("listRequestLogs", () => {
  it("tant que la route est absente (B-LOG-1) : rejette sans aucun fetch", async () => {
    const calls = stubApi({});
    await expect(listRequestLogs(REQUESTS, LOG_BACK_SUPPORT)).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("refuse une requête de type erreurs", async () => {
    await expect(listRequestLogs(BASE, LOG_BACK_SUPPORT_ALL)).rejects.toThrow();
  });

  it("back livré : fixture reconstruite → Page, IP et durée mappées", async () => {
    const calls = stubApi({ "/api/logs/requests": fixture("requests-page-1.json") });
    const page = await listRequestLogs(REQUESTS, LOG_BACK_SUPPORT_ALL);
    expect(page).toMatchObject({ page: 1, pageCount: 3, total: 120, perPage: 50 });
    expect(page.items[0]).toEqual({
      id: 5200,
      occurredAt: "2026-10-12T12:02:11.000000Z",
      method: "GET",
      route: "/api/matchs",
      statusCode: 200,
      durationMs: 120,
      user: { id: 4, username: "theo.bernard" },
      platform: "mobile",
      os: "Android 14",
      ipAddress: "203.0.113.17",
      position: null,
    });
    expect(calls[0].path).toBe("/api/logs/requests");
    expect(calls[0].search).toBe("?per_page=50&page=1");
  });

  it("format invalide (durée négative) → rejette", async () => {
    const body = fixture<{ data: Row[] }>("requests-page-1.json");
    body.data[0].duration_ms = -5;
    stubApi({ "/api/logs/requests": body });
    await expect(listRequestLogs(REQUESTS, LOG_BACK_SUPPORT_ALL)).rejects.toBeInstanceOf(ZodError);
  });
});

describe("buildLogBackSearch", () => {
  const ALL_FILTERS = {
    utilisateur: "lucas.marchand",
    plateforme: "web" as const,
    os: "Android 14",
    route: "/api/joueurs",
    statut: "5xx" as const,
    du: "2026-10-12",
    au: "2026-10-12",
  };

  it("back livré, requêtes : tout est émis, dans un ordre stable et encodé", () => {
    expect(buildLogBackSearch({ ...REQUESTS, filters: ALL_FILTERS, page: 3 }, LOG_BACK_SUPPORT_ALL)).toBe(
      "per_page=50&page=3&platform=web&os=Android+14&route=%2Fapi%2Fjoueurs&username=lucas.marchand&status_min=500&status_max=599&from=2026-10-11T22%3A00%3A00Z&to=2026-10-12T21%3A59%3A59Z",
    );
  });

  it("statut par classe : bornes", () => {
    const search = (statut: "2xx" | "3xx" | "4xx" | "5xx") =>
      buildLogBackSearch({ ...REQUESTS, filters: { statut } }, LOG_BACK_SUPPORT_ALL);
    expect(search("2xx")).toContain("status_min=200&status_max=299");
    expect(search("3xx")).toContain("status_min=300&status_max=399");
    expect(search("4xx")).toContain("status_min=400&status_max=499");
    expect(search("5xx")).toContain("status_min=500&status_max=599");
  });

  it("jour d'hiver : du=au=2026-01-15", () => {
    expect(buildLogBackSearch({ ...BASE, filters: { du: "2026-01-15", au: "2026-01-15" } }, LOG_BACK_SUPPORT_ALL)).toBe(
      "per_page=50&page=1&from=2026-01-14T23%3A00%3A00Z&to=2026-01-15T22%3A59%3A59Z",
    );
  });

  it("le filtre utilisateur envoie le NOM (`username`), jamais un identifiant", () => {
    const search = buildLogBackSearch({ ...BASE, filters: { utilisateur: "theo.bernard" } }, LOG_BACK_SUPPORT_ALL);
    expect(search).toContain("username=theo.bernard");
    expect(search).not.toContain("user_id");
  });

  it("back actuel : un filtre inactif n'est jamais émis, même présent dans l'objet", () => {
    expect(buildLogBackSearch({ ...BASE, filters: ALL_FILTERS, page: 2 })).toBe("per_page=50&page=2&platform=web&os=Android+14");
  });

  it("`source` n'est émise que pour les erreurs", () => {
    expect(buildLogBackSearch({ ...BASE, filters: { source: "client" } })).toContain("source=client");
    expect(buildLogBackSearch({ ...REQUESTS, filters: { source: "client" } }, LOG_BACK_SUPPORT_ALL)).not.toContain("source");
  });

  it("valeurs avec & et % : encodées", () => {
    expect(buildLogBackSearch({ ...BASE, filters: { os: "a&b=100%" } })).toBe("per_page=50&page=1&os=a%26b%3D100%25");
  });
});
