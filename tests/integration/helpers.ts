import { readFileSync } from "node:fs";
import path from "node:path";
import { vi } from "vitest";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

export function loadFixture<T = unknown>(name: string, dir = "home"): T {
  return JSON.parse(readFileSync(path.join(FIXTURES_DIR, dir, name), "utf8")) as T;
}

type Route = { status?: number; body: unknown };

export type FetchCall = {
  path: string;
  /** Chaîne de recherche (`?a=1&b=2`), vide s'il n'y en a pas. */
  search?: string;
  method: string;
  headers: Headers;
  /** Corps envoyé tel quel (JSON sérialisé), `null` s'il n'y en a pas. */
  body: string | null;
  signal: AbortSignal | null;
  /** Option `cache` de `fetch` (`no-store`, `force-cache`…), `null` si absente. */
  cache?: RequestCache | null;
  /** Option `next` de `fetch` (`revalidate`, `tags`), `null` si absente. */
  next?: unknown;
};

/** Remplace `fetch` par un faux back qui sert les routes données. Renvoie la liste des appels. */
export function stubApi(routes: Record<string, Route | unknown>): FetchCall[] {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({
        path: url.pathname,
        search: url.search,
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: typeof init?.body === "string" ? init.body : null,
        signal: init?.signal ?? null,
        cache: init?.cache ?? null,
        next: (init as { next?: unknown } | undefined)?.next ?? null,
      });
      if (!(url.pathname in routes)) return new Response("Not found", { status: 404 });
      const route = routes[url.pathname];
      const { status, body } =
        typeof route === "object" && route !== null && "body" in route ? (route as Route) : { status: 200, body: route };
      return new Response(JSON.stringify(body), { status: status ?? 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}
