export type WriteFailure =
  /** 422 : messages du back par champ. */
  | { kind: "invalid"; errors: Readonly<Record<string, readonly string[]>> }
  /** 404 : message du back, jamais affiché. */
  | { kind: "notFound"; backMessage: string | null }
  /** 403 : le back protégera un jour ses routes. */
  | { kind: "forbidden" }
  /** 409 (futur). */
  | { kind: "conflict" }
  /** Réseau / délai, 5xx, autre 4xx. */
  | { kind: "failed"; reason: "network" | "server" };

export type WriteResult<T> = { kind: "ok"; value: T } | WriteFailure;
