import { describe, expect, it } from "vitest";
import { buildAdminListHref } from "@/models/buildAdminListHref";
import { compareText } from "@/models/compareText";
import { parseAdminListQuery } from "@/models/parseAdminListQuery";
import { resolveAdminListQuery } from "@/models/resolveAdminListQuery";
import { sortRows } from "@/models/sortRows";
import { toggleSort } from "@/models/toggleSort";
import type { AdminListQuery, AdminListSpec } from "@/models/AdminListQuery";

const SPEC: AdminListSpec = {
  sortable: ["name", "date"],
  defaultSort: { column: "name", direction: "asc" },
  filters: ["type", "statut"],
};
const BASE = "/admin/team";

function toRaw(href: string): Record<string, string> {
  return Object.fromEntries(new URL(href, "http://x").searchParams);
}

describe("parseAdminListQuery", () => {
  it("valeurs par défaut", () => {
    expect(parseAdminListQuery({}, SPEC)).toEqual({ q: "", sort: SPEC.defaultSort, filters: {}, page: 1 });
  });

  it("lit q (trim, 100 caractères max), tri, ordre, page et filtres", () => {
    const query = parseAdminListQuery(
      { q: "  lucas ", tri: "date", ordre: "desc", page: "3", type: "club", statut: "" },
      SPEC,
    );
    expect(query).toEqual({ q: "lucas", sort: { column: "date", direction: "desc" }, filters: { type: "club" }, page: 3 });
    expect(parseAdminListQuery({ q: "x".repeat(150) }, SPEC).q).toHaveLength(100);
  });

  it("page invalide → 1", () => {
    for (const page of ["0", "-2", "abc", "1.5", "", "99999999999999999999"]) {
      expect(parseAdminListQuery({ page }, SPEC).page).toBe(1);
    }
  });

  it("tri inconnu → colonne par défaut ; ordre invalide → direction par défaut", () => {
    expect(parseAdminListQuery({ tri: "inconnu", ordre: "up" }, SPEC).sort).toEqual(SPEC.defaultSort);
  });

  it("prend le premier élément d'un tableau et ignore les clés inconnues", () => {
    const query = parseAdminListQuery({ q: ["a", "b"], notice: "created", ref: "1", autre: "x" }, SPEC);
    expect(query.q).toBe("a");
    expect(query.filters).toEqual({});
  });
});

describe("buildAdminListHref", () => {
  const base: AdminListQuery = { q: "", sort: SPEC.defaultSort, filters: {}, page: 1 };

  it("forme canonique : sans paramètre quand tout est par défaut", () => {
    expect(buildAdminListHref(BASE, base, SPEC)).toBe(BASE);
  });

  it("ordre fixe : q, filtres, tri, ordre, page", () => {
    const query: AdminListQuery = {
      q: "é a",
      sort: { column: "date", direction: "desc" },
      filters: { statut: "ok", type: "club" },
      page: 2,
    };
    expect(buildAdminListHref(BASE, query, SPEC)).toBe(`${BASE}?q=%C3%A9+a&type=club&statut=ok&tri=date&ordre=desc&page=2`);
  });

  it("omet tri et ordre séparément quand ils valent les défauts", () => {
    expect(buildAdminListHref(BASE, { ...base, sort: { column: "date", direction: "asc" } }, SPEC)).toBe(
      `${BASE}?tri=date`,
    );
    expect(buildAdminListHref(BASE, { ...base, sort: { column: "name", direction: "desc" } }, SPEC)).toBe(
      `${BASE}?ordre=desc`,
    );
  });

  it("aller-retour parse(build(q)) = q", () => {
    const queries: AdminListQuery[] = [
      base,
      { q: "lucas marchand", sort: { column: "date", direction: "desc" }, filters: { type: "club" }, page: 4 },
      { q: "", sort: { column: "date", direction: "asc" }, filters: {}, page: 1 },
    ];
    for (const query of queries) {
      expect(parseAdminListQuery(toRaw(buildAdminListHref(BASE, query, SPEC)), SPEC)).toEqual(query);
    }
  });

  it("aller-retour avec un tri par défaut descendant", () => {
    const spec: AdminListSpec = { ...SPEC, defaultSort: { column: "date", direction: "desc" } };
    const query: AdminListQuery = { q: "", sort: { column: "name", direction: "asc" }, filters: {}, page: 1 };
    expect(parseAdminListQuery(toRaw(buildAdminListHref(BASE, query, spec)), spec)).toEqual(query);
  });
});

describe("resolveAdminListQuery", () => {
  it("URL canonique → pas de redirection", () => {
    expect(resolveAdminListQuery(BASE, {}, SPEC).redirectTo).toBeNull();
    expect(resolveAdminListQuery(BASE, { q: "a", tri: "date", page: "2" }, SPEC).redirectTo).toBeNull();
  });

  it("aucune boucle : resolve(build(q)) → null", () => {
    const query: AdminListQuery = { q: "a b", sort: { column: "date", direction: "desc" }, filters: { type: "x" }, page: 2 };
    expect(resolveAdminListQuery(BASE, toRaw(buildAdminListHref(BASE, query, SPEC)), SPEC).redirectTo).toBeNull();
  });

  it.each<[string, Record<string, string | string[]>, string]>([
    ["page=1 explicite", { page: "1" }, BASE],
    ["page invalide", { page: "abc" }, BASE],
    ["tri par défaut écrit", { tri: "name" }, BASE],
    ["tri inconnu", { tri: "zzz", q: "a" }, `${BASE}?q=a`],
    ["ordre invalide", { ordre: "up" }, BASE],
    ["q avec espaces", { q: "  a " }, `${BASE}?q=a`],
    ["q vide écrit", { q: "" }, BASE],
    ["filtre vide écrit", { type: "" }, BASE],
    ["tableau", { q: ["a", "b"] }, `${BASE}?q=a`],
  ])("redirige vers la forme canonique : %s", (_label, raw, expected) => {
    expect(resolveAdminListQuery(BASE, raw, SPEC).redirectTo).toBe(expected);
  });

  it("conserve notice et ref dans redirectTo (en dernier)", () => {
    const { redirectTo } = resolveAdminListQuery(BASE, { page: "1", q: "a", notice: "created", ref: "7" }, SPEC);
    expect(redirectTo).toBe(`${BASE}?q=a&notice=created&ref=7`);
  });

  it("une notice seule ne déclenche pas de redirection", () => {
    expect(resolveAdminListQuery(BASE, { notice: "deleted" }, SPEC).redirectTo).toBeNull();
  });

  it("renvoie la requête interprétée", () => {
    expect(resolveAdminListQuery(BASE, { q: "a", page: "2" }, SPEC).query).toEqual({
      q: "a",
      sort: SPEC.defaultSort,
      filters: {},
      page: 2,
    });
  });
});

describe("toggleSort", () => {
  it("même colonne : inverse ; autre colonne : asc", () => {
    expect(toggleSort({ column: "name", direction: "asc" }, "name")).toEqual({ column: "name", direction: "desc" });
    expect(toggleSort({ column: "name", direction: "desc" }, "name")).toEqual({ column: "name", direction: "asc" });
    expect(toggleSort({ column: "name", direction: "desc" }, "date")).toEqual({ column: "date", direction: "asc" });
  });
});

describe("compareText", () => {
  it("ignore accents et casse", () => {
    expect(compareText("Élodie", "Fabien")).toBeLessThan(0);
    expect(compareText("Fabien", "Élodie")).toBeGreaterThan(0);
    expect(compareText("abc", "ABC")).toBe(0);
  });

  it("chiffres numériques : 2 avant 10", () => {
    expect(compareText("2", "10")).toBeLessThan(0);
    expect(compareText("U13", "U9")).toBeGreaterThan(0);
  });

  it("null et vide après toute valeur ; ex æquo → 0", () => {
    expect(compareText(null, "a")).toBeGreaterThan(0);
    expect(compareText("", "a")).toBeGreaterThan(0);
    expect(compareText("a", null)).toBeLessThan(0);
    expect(compareText(null, "")).toBe(0);
    expect(compareText(null, null)).toBe(0);
  });
});

describe("sortRows", () => {
  type Row = { id: number; name: string | null };
  const rows: Row[] = [
    { id: 3, name: "b" },
    { id: 1, name: "a" },
    { id: 2, name: "a" },
    { id: 4, name: null },
  ];
  const comparators = { name: (a: Row, b: Row) => compareText(a.name, b.name) };
  const tieBreak = (a: Row, b: Row) => a.id - b.id;

  it("trie en croissant, ex æquo départagés par tieBreak", () => {
    expect(sortRows(rows, { column: "name", direction: "asc" }, comparators, tieBreak).map((r) => r.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("desc inverse le comparateur mais pas le tieBreak", () => {
    expect(sortRows(rows, { column: "name", direction: "desc" }, comparators, tieBreak).map((r) => r.id)).toEqual([
      4, 3, 1, 2,
    ]);
  });

  it("colonne sans comparateur → tieBreak seul", () => {
    expect(sortRows(rows, { column: "autre", direction: "desc" }, comparators, tieBreak).map((r) => r.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("ne mute pas la liste d'entrée", () => {
    const copy = [...rows];
    const sorted = sortRows(rows, { column: "name", direction: "asc" }, comparators, tieBreak);
    expect(rows).toEqual(copy);
    expect(sorted).not.toBe(rows);
  });
});
