import { describe, expect, it } from "vitest";
import type { ErrorLogEntry } from "@/models/ErrorLogEntry";
import { LOG_BACK_SUPPORT, type LogBackSupportTable } from "@/models/LogBackSupport";
import { LOG_FILTER_KEYS, LOG_TARGET_FILTERS } from "@/models/LogFilters";
import { LOG_MAX_PAGE, type LogListQuery } from "@/models/LogListQuery";
import { LOG_STATUS_CLASS_LABELS } from "@/models/LogStatusClass";
import { buildLogListHref } from "@/models/buildLogListHref";
import { buildLogPeriod } from "@/models/buildLogPeriod";
import { classifyLogStatus } from "@/models/classifyLogStatus";
import { describeLogDetailTitle } from "@/models/describeLogDetailTitle";
import { describeLogEntry } from "@/models/describeLogEntry";
import { describeLogPlatform } from "@/models/describeLogPlatform";
import { describeLogPosition } from "@/models/describeLogPosition";
import { describeLogUser } from "@/models/describeLogUser";
import { findLogEntry } from "@/models/findLogEntry";
import { formatLogContext } from "@/models/formatLogContext";
import { getActiveLogFilters } from "@/models/getActiveLogFilters";
import { getDisplayedErrorMethod } from "@/models/getDisplayedErrorMethod";
import { getParisDayEndUtc } from "@/models/getParisDayEndUtc";
import { getParisDayStartUtc } from "@/models/getParisDayStartUtc";
import { getParisOffsetMinutes } from "@/models/getParisOffsetMinutes";
import { listAvailableLogKinds } from "@/models/listAvailableLogKinds";
import { LOG_MESSAGES } from "@/models/logMessages";
import { describeLogRetention, LOG_RETENTION_DAYS } from "@/models/logRetention";
import { parseLogKind } from "@/models/parseLogKind";
import { parseLogListQuery } from "@/models/parseLogListQuery";
import { LOG_BACK_SUPPORT_ALL, resolveLogBackSupport } from "@/models/resolveLogBackSupport";
import { resolveLogListQuery } from "@/models/resolveLogListQuery";
import { sanitizeUntrustedText } from "@/models/sanitizeUntrustedText";
import { truncateText } from "@/models/truncateText";

/** Table de test : le back « livré » (onglet Requêtes et tous les filtres ciblés). */
const ALL: LogBackSupportTable = LOG_BACK_SUPPORT_ALL;

const parseQueryString = (href: string): Record<string, string | string[]> => {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(href.split("?")[1] ?? "")) {
    const previous = result[key];
    result[key] = previous === undefined ? value : [...(Array.isArray(previous) ? previous : [previous]), value];
  }
  return result;
};

describe("LOG_BACK_SUPPORT (état du back au 12/10/2026)", () => {
  it("seul l'onglet Erreurs existe, avec plateforme, os et source", () => {
    expect(listAvailableLogKinds()).toEqual(["errors"]);
    expect(getActiveLogFilters("errors")).toEqual(["plateforme", "os", "source"]);
    expect(LOG_BACK_SUPPORT.requests.available).toBe(false);
  });

  it("rétention : 7 jours, une seule définition", () => {
    expect(LOG_RETENTION_DAYS).toBe(7);
    expect(describeLogRetention()).toBe("Les journaux sont conservés 7 jours, puis supprimés automatiquement.");
  });
});

describe("resolveLogBackSupport (variable de test)", () => {
  it("`all` n'est lu que si NODE_ENV=test", () => {
    expect(resolveLogBackSupport({ nodeEnv: "test", override: "all" })).toBe(LOG_BACK_SUPPORT_ALL);
    expect(resolveLogBackSupport({ nodeEnv: "production", override: "all" })).toBe(LOG_BACK_SUPPORT);
    expect(resolveLogBackSupport({ nodeEnv: "development", override: "all" })).toBe(LOG_BACK_SUPPORT);
    expect(resolveLogBackSupport({ nodeEnv: undefined, override: "all" })).toBe(LOG_BACK_SUPPORT);
  });

  it("toute autre valeur (ou absence) garde la table de production", () => {
    expect(resolveLogBackSupport({ nodeEnv: "test", override: undefined })).toBe(LOG_BACK_SUPPORT);
    expect(resolveLogBackSupport({ nodeEnv: "test", override: "some" })).toBe(LOG_BACK_SUPPORT);
  });
});

describe("parseLogKind / listAvailableLogKinds / getActiveLogFilters", () => {
  it("`requetes` est refusé tant que la route est absente ; inconnu ou absent → erreurs", () => {
    expect(parseLogKind("requetes")).toBe("errors");
    expect(parseLogKind("erreurs")).toBe("errors");
    expect(parseLogKind("autre")).toBe("errors");
    expect(parseLogKind(undefined)).toBe("errors");
    expect(parseLogKind("Requetes", ALL)).toBe("errors");
  });

  it("une fois le back livré, `requetes` est accepté", () => {
    expect(parseLogKind("requetes", ALL)).toBe("requests");
    expect(listAvailableLogKinds(ALL)).toEqual(["errors", "requests"]);
  });

  it("intersection cible × back : `source` seulement pour les erreurs, `du` inactif aujourd'hui", () => {
    expect(getActiveLogFilters("errors")).not.toContain("du");
    expect(getActiveLogFilters("errors")).toContain("source");
    expect(getActiveLogFilters("requests")).not.toContain("source");
    expect(getActiveLogFilters("requests")).toEqual(["plateforme", "os", "route", "du", "au"]);
  });

  it("avec la table entièrement activée, tous les filtres ciblés sont actifs, dans l'ordre canonique", () => {
    expect(getActiveLogFilters("errors", ALL)).toEqual(LOG_FILTER_KEYS);
    expect(getActiveLogFilters("requests", ALL)).toEqual(LOG_TARGET_FILTERS.requests);
    expect(getActiveLogFilters("requests", ALL)).not.toContain("source");
  });
});

describe("parseLogListQuery", () => {
  it("URL vide → erreurs, page 1, aucun filtre, aucun détail", () => {
    expect(parseLogListQuery({})).toEqual({ kind: "errors", filters: {}, page: 1, detailId: null });
  });

  it("page invalide ou hors borne → 1", () => {
    for (const page of ["0", "-1", "abc", "1e3", "100001", "1.5", " ", "007"]) {
      expect(parseLogListQuery({ page }).page).toBe(1);
    }
    expect(parseLogListQuery({ page: "3" }).page).toBe(3);
    expect(parseLogListQuery({ page: String(LOG_MAX_PAGE) }).page).toBe(LOG_MAX_PAGE);
  });

  it("clé répétée : premier élément", () => {
    expect(parseLogListQuery({ os: ["android", "ios"] }).filters.os).toBe("android");
    expect(parseLogListQuery({ page: ["2", "9"] }).page).toBe(2);
  });

  it("filtres actifs : plateforme, source, os ; valeurs rognées", () => {
    const query = parseLogListQuery({ plateforme: "web", source: "client", os: "  Android 14 " });
    expect(query.filters).toEqual({ plateforme: "web", source: "client", os: "Android 14" });
  });

  it("valeurs invalides rejetées : plateforme inconnue, source inconnue", () => {
    expect(parseLogListQuery({ plateforme: "ios" }).filters).toEqual({});
    expect(parseLogListQuery({ source: "other" }).filters).toEqual({});
  });

  it("filtre inactif retiré (du, au, route, statut, utilisateur aujourd'hui)", () => {
    const raw = { du: "2026-10-12", au: "2026-10-13", route: "/api", statut: "5xx", utilisateur: "lucas", os: "ios" };
    expect(parseLogListQuery(raw).filters).toEqual({ os: "ios" });
  });

  it("avec le back livré : statut dépend du type, `3xx` refusé pour les erreurs", () => {
    expect(parseLogListQuery({ statut: "5xx" }, ALL).filters.statut).toBe("5xx");
    expect(parseLogListQuery({ statut: "3xx" }, ALL).filters.statut).toBeUndefined();
    expect(parseLogListQuery({ type: "requetes", statut: "3xx" }, ALL).filters.statut).toBe("3xx");
    expect(parseLogListQuery({ type: "requetes", source: "client" }, ALL).filters.source).toBeUndefined();
  });

  it("dates : jour calendaire réel seulement", () => {
    expect(parseLogListQuery({ du: "2026-02-30", au: "2026-13-45" }, ALL).filters).toEqual({});
    expect(parseLogListQuery({ du: "2026-10-12" }, ALL).filters.du).toBe("2026-10-12");
    expect(parseLogListQuery({ du: "12/10/2026" }, ALL).filters.du).toBeUndefined();
  });

  it("période inversée : les deux dates sont échangées (D-L5)", () => {
    const { filters } = parseLogListQuery({ du: "2026-10-20", au: "2026-10-12" }, ALL);
    expect(filters).toEqual({ du: "2026-10-12", au: "2026-10-20" });
  });

  it("longueurs : valeur rejetée, jamais tronquée (os 50, route 191, utilisateur 255)", () => {
    expect(parseLogListQuery({ os: "a".repeat(50) }).filters.os).toHaveLength(50);
    expect(parseLogListQuery({ os: "a".repeat(51) }).filters.os).toBeUndefined();
    expect(parseLogListQuery({ route: "a".repeat(191) }, ALL).filters.route).toHaveLength(191);
    expect(parseLogListQuery({ route: "a".repeat(192) }, ALL).filters.route).toBeUndefined();
    expect(parseLogListQuery({ utilisateur: "a".repeat(255) }, ALL).filters.utilisateur).toHaveLength(255);
    expect(parseLogListQuery({ utilisateur: "a".repeat(256) }, ALL).filters.utilisateur).toBeUndefined();
  });

  it("caractère de contrôle dans une valeur texte → rejetée", () => {
    expect(parseLogListQuery({ os: "ios\n14" }).filters.os).toBeUndefined();
    expect(parseLogListQuery({ os: "ios\u0000" }).filters.os).toBeUndefined();
    expect(parseLogListQuery({ os: "ios\u007F" }).filters.os).toBeUndefined();
  });

  it("per_page, sort et clés inconnues sont ignorés", () => {
    expect(parseLogListQuery({ per_page: "100000", sort: "x", foo: "bar" })).toEqual({
      kind: "errors",
      filters: {},
      page: 1,
      detailId: null,
    });
  });

  it("detail : entier strictement positif, sinon null", () => {
    expect(parseLogListQuery({ detail: "1840" }).detailId).toBe(1840);
    for (const detail of ["0", "abc", "-3", "1.5", "12345678901"]) {
      expect(parseLogListQuery({ detail }).detailId).toBeNull();
    }
  });
});

describe("buildLogListHref", () => {
  const base: LogListQuery = { kind: "errors", filters: {}, page: 1, detailId: null };

  it("sans paramètre : /admin/logs", () => {
    expect(buildLogListHref(base)).toBe("/admin/logs");
  });

  it("ordre fixe : type, filtres (ordre canonique), page, detail ; valeurs par défaut omises", () => {
    expect(
      buildLogListHref({
        kind: "requests",
        filters: { au: "2026-10-13", os: "ios", plateforme: "web", du: "2026-10-12", route: "/api" },
        page: 3,
        detailId: 18,
      }),
    ).toBe("/admin/logs?type=requetes&plateforme=web&os=ios&route=%2Fapi&du=2026-10-12&au=2026-10-13&page=3&detail=18");
    expect(buildLogListHref({ ...base, page: 1 })).not.toContain("page=");
    expect(buildLogListHref({ ...base, kind: "errors" })).not.toContain("type=");
  });

  it("encodage : é, espace, &, %", () => {
    const href = buildLogListHref({ ...base, filters: { os: "é & 100% x" } });
    expect(href).toBe("/admin/logs?os=%C3%A9+%26+100%25+x");
    expect(parseLogListQuery(parseQueryString(href)).filters.os).toBe("é & 100% x");
  });

  it("aller-retour : parse(build(q)) = q", () => {
    const query: LogListQuery = {
      kind: "requests",
      filters: { utilisateur: "lucas.marchand", statut: "5xx", du: "2026-01-15", au: "2026-01-16" },
      page: 4,
      detailId: 77,
    };
    expect(parseLogListQuery(parseQueryString(buildLogListHref(query)), ALL)).toEqual(query);
  });

  it("dériver une URL : changer de page retire le détail", () => {
    expect(buildLogListHref({ ...base, page: 3, detailId: null })).toBe("/admin/logs?page=3");
  });
});

describe("resolveLogListQuery", () => {
  it("URL canonique → pas de redirection", () => {
    expect(resolveLogListQuery({}).redirectTo).toBeNull();
    expect(resolveLogListQuery({ os: "ios", page: "2" }).redirectTo).toBeNull();
    expect(resolveLogListQuery({ page: "2", os: "ios" }).redirectTo).toBeNull();
  });

  it("l'ordre des paramètres seul ne redirige pas", () => {
    expect(resolveLogListQuery({ source: "client", plateforme: "web" }).redirectTo).toBeNull();
  });

  it("formes non canoniques → redirection vers la forme canonique", () => {
    const cases: [Record<string, string | string[]>, string][] = [
      [{ page: "1" }, "/admin/logs"],
      [{ type: "erreurs" }, "/admin/logs"],
      [{ per_page: "100000" }, "/admin/logs"],
      [{ foo: "bar" }, "/admin/logs"],
      [{ os: "  ios " }, "/admin/logs?os=ios"],
      [{ os: ["ios", "android"] }, "/admin/logs?os=ios"],
      [{ plateforme: "ios" }, "/admin/logs"],
      [{ os: "" }, "/admin/logs"],
      [{ du: "2026-10-12" }, "/admin/logs"],
      [{ type: "requetes" }, "/admin/logs"],
    ];
    for (const [raw, expected] of cases) {
      expect(resolveLogListQuery(raw).redirectTo).toBe(expected);
    }
  });

  it("avec le back livré : période inversée redressée, date invalide retirée", () => {
    expect(resolveLogListQuery({ du: "2026-10-20", au: "2026-10-12" }, ALL).redirectTo).toBe(
      "/admin/logs?du=2026-10-12&au=2026-10-20",
    );
    expect(resolveLogListQuery({ du: "2026-13-45" }, ALL).redirectTo).toBe("/admin/logs");
    expect(resolveLogListQuery({ type: "requetes" }, ALL).redirectTo).toBeNull();
  });

  it("est idempotente : l'URL de redirection se résout sans nouvelle redirection (aucune boucle)", () => {
    const inputs: Record<string, string | string[]>[] = [
      { page: "1", per_page: "9", os: " ios ", plateforme: "ios", detail: "0" },
      { du: "2026-10-20", au: "2026-10-12", type: "requetes", statut: "3xx", route: ["a", "b"] },
      { os: "é & 100%", page: "abc", foo: ["1", "2"] },
    ];
    for (const raw of inputs) {
      for (const support of [LOG_BACK_SUPPORT, ALL]) {
        const { redirectTo, query } = resolveLogListQuery(raw, support);
        const target = redirectTo ?? buildLogListHref(query);
        const second = resolveLogListQuery(parseQueryString(target), support);
        expect(second.redirectTo).toBeNull();
        expect(second.query).toEqual(query);
      }
    }
  });
});

describe("findLogEntry", () => {
  const items = [{ id: 3 }, { id: 8 }];
  it("première entrée d'identifiant égal, sinon null", () => {
    expect(findLogEntry(items, 8)).toBe(items[1]);
    expect(findLogEntry(items, 9)).toBeNull();
  });
});

describe("période : heure de Paris → UTC", () => {
  it("décalage de Paris : +120 l'été, +60 l'hiver", () => {
    expect(getParisOffsetMinutes(new Date("2026-07-01T12:00:00Z"))).toBe(120);
    expect(getParisOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(60);
  });

  it("2026-10-12 (CEST, +2) : 00:00:00 → 23:59:59 heure de Paris", () => {
    expect(getParisDayStartUtc("2026-10-12")).toBe("2026-10-11T22:00:00Z");
    expect(getParisDayEndUtc("2026-10-12")).toBe("2026-10-12T21:59:59Z");
  });

  it("2026-01-15 (CET, +1)", () => {
    expect(getParisDayStartUtc("2026-01-15")).toBe("2026-01-14T23:00:00Z");
    expect(getParisDayEndUtc("2026-01-15")).toBe("2026-01-15T22:59:59Z");
  });

  it("2026-03-29 : passage à l'heure d'été, journée de 23 h", () => {
    expect(getParisDayStartUtc("2026-03-29")).toBe("2026-03-28T23:00:00Z");
    expect(getParisDayEndUtc("2026-03-29")).toBe("2026-03-29T21:59:59Z");
  });

  it("2026-10-25 : retour à l'heure d'hiver, journée de 25 h", () => {
    expect(getParisDayStartUtc("2026-10-25")).toBe("2026-10-24T22:00:00Z");
    expect(getParisDayEndUtc("2026-10-25")).toBe("2026-10-25T22:59:59Z");
  });

  it("la fin d'un jour est le début du lendemain moins une seconde, y compris sur les jours de changement d'heure", () => {
    for (const [day, next] of [
      ["2026-10-12", "2026-10-13"],
      ["2026-03-28", "2026-03-29"],
      ["2026-03-29", "2026-03-30"],
      ["2026-10-24", "2026-10-25"],
      ["2026-10-25", "2026-10-26"],
      ["2026-12-31", "2027-01-01"],
    ]) {
      const end = new Date(getParisDayEndUtc(day)).getTime();
      expect(end + 1000).toBe(new Date(getParisDayStartUtc(next)).getTime());
    }
  });

  it("une date inexistante lève RangeError", () => {
    expect(() => getParisDayStartUtc("2026-02-30")).toThrow(RangeError);
    expect(() => getParisDayEndUtc("2026-13-45")).toThrow(RangeError);
    expect(() => getParisDayStartUtc("n'importe quoi")).toThrow(RangeError);
  });

  it("buildLogPeriod : « du 12/10 au 12/10 » ; bornes absentes → null", () => {
    expect(buildLogPeriod({ du: "2026-10-12", au: "2026-10-12" })).toEqual({
      from: "2026-10-11T22:00:00Z",
      to: "2026-10-12T21:59:59Z",
    });
    expect(buildLogPeriod({ du: "2026-01-15" })).toEqual({ from: "2026-01-14T23:00:00Z", to: null });
    expect(buildLogPeriod({ au: "2026-01-15" })).toEqual({ from: null, to: "2026-01-15T22:59:59Z" });
    expect(buildLogPeriod({})).toEqual({ from: null, to: null });
  });
});

describe("classifyLogStatus", () => {
  it("classes HTTP", () => {
    expect(classifyLogStatus(200)).toBe("success");
    expect(classifyLogStatus(301)).toBe("redirect");
    expect(classifyLogStatus(404)).toBe("clientError");
    expect(classifyLogStatus(422)).toBe("clientError");
    expect(classifyLogStatus(500)).toBe("serverError");
    expect(classifyLogStatus(503)).toBe("serverError");
    expect(classifyLogStatus(599)).toBe("serverError");
  });

  it("hors 200-599, 1xx et null : sans statut", () => {
    for (const code of [600, 100, 199, 0, -1, 404.5]) expect(classifyLogStatus(code)).toBe("none");
    expect(classifyLogStatus(null)).toBe("none");
  });

  it("libellés en toutes lettres", () => {
    expect(LOG_STATUS_CLASS_LABELS.clientError).toBe("Erreur client");
    expect(LOG_STATUS_CLASS_LABELS.none).toBe("Sans statut");
  });
});

describe("sanitizeUntrustedText", () => {
  it("remplace contrôles C0, DEL, C1 et marques bidirectionnelles par U+FFFD", () => {
    expect(sanitizeUntrustedText("a‮b")).toBe("a�b");
    expect(sanitizeUntrustedText("a\u0000b")).toBe("a�b");
    expect(sanitizeUntrustedText("a\u007Fb")).toBe("a�b");
    expect(sanitizeUntrustedText("a\u0085b")).toBe("a�b");
    expect(sanitizeUntrustedText("a‏b⁦c؜d")).toBe("a�b�c�d");
    expect(sanitizeUntrustedText("a\u0007b")).toBe("a�b");
  });

  it("\\n et \\t : conservés en multiline, une espace sinon", () => {
    expect(sanitizeUntrustedText("a\nb\tc", { multiline: true })).toBe("a\nb\tc");
    expect(sanitizeUntrustedText("a\nb\tc")).toBe("a b c");
    expect(sanitizeUntrustedText("a\r\nb")).toBe("a b");
    expect(sanitizeUntrustedText("a\r\nb", { multiline: true })).toBe("a\nb");
    expect(sanitizeUntrustedText("a\rb", { multiline: true })).toBe("a�b");
  });

  it("le HTML est laissé tel quel (React l'échappe), les emoji sont conservés", () => {
    expect(sanitizeUntrustedText("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
    expect(sanitizeUntrustedText('<a href="https://x">x</a> 🏀')).toBe('<a href="https://x">x</a> 🏀');
  });
});

describe("truncateText", () => {
  it("texte vide", () => {
    expect(truncateText("", 5)).toEqual({ text: "", truncated: false, totalChars: 0 });
  });

  it("exactement maxChars : pas de troncature ; maxChars + 1 : tronqué", () => {
    expect(truncateText("abcde", 5)).toEqual({ text: "abcde", truncated: false, totalChars: 5 });
    expect(truncateText("abcdef", 5)).toEqual({ text: "abcde", truncated: true, totalChars: 6 });
  });

  it("compte en points de code : un emoji hors plan multilingue n'est jamais coupé", () => {
    const text = "🏀🏀🏀";
    expect(text.length).toBe(6);
    expect(truncateText(text, 2)).toEqual({ text: "🏀🏀", truncated: true, totalChars: 3 });
    expect(truncateText(text, 3).truncated).toBe(false);
  });
});

describe("formatLogContext", () => {
  it("null → null", () => {
    expect(formatLogContext(null)).toBeNull();
  });

  it("objet, tableau et imbriqué : JSON indenté de 2", () => {
    expect(formatLogContext({ a: 1 })).toEqual({ text: '{\n  "a": 1\n}', truncated: false, totalChars: 12 });
    expect(formatLogContext([1, 2])?.text).toBe("[\n  1,\n  2\n]");
    expect(formatLogContext({ a: { b: [true] } })?.text).toBe('{\n  "a": {\n    "b": [\n      true\n    ]\n  }\n}');
  });

  it("plus de 20 000 caractères : tronqué avec le total d'origine", () => {
    const result = formatLogContext({ big: "x".repeat(30_000) });
    expect(result?.truncated).toBe(true);
    expect(Array.from(result?.text ?? "")).toHaveLength(20_000);
    expect(result?.totalChars).toBeGreaterThan(30_000);
  });

  it("caractères bidirectionnels d'une valeur neutralisés ; sauts de ligne conservés", () => {
    const result = formatLogContext({ k: "a‮b" });
    expect(result?.text).toContain("a�b");
    expect(result?.text).toContain("\n");
  });

  it("maxChars explicite", () => {
    expect(formatLogContext({ a: 1 }, 5)).toMatchObject({ truncated: true, totalChars: 12 });
  });
});

describe("descriptions", () => {
  it("describeLogUser : nom assaini ou « Anonyme »", () => {
    expect(describeLogUser(null)).toBe("Anonyme");
    expect(describeLogUser({ id: 1, username: "theo.bernard" })).toBe("theo.bernard");
    expect(describeLogUser({ id: 1, username: "x‮y" })).toBe("x�y");
  });

  it("describeLogPlatform", () => {
    expect(describeLogPlatform("web", null)).toBe("Web");
    expect(describeLogPlatform("mobile", "Android 14")).toBe("Mobile · Android 14");
    expect(describeLogPlatform("console", null)).toBe("console");
    expect(describeLogPlatform(null, "iOS 17")).toBe("iOS 17");
    expect(describeLogPlatform(null, null)).toBe("—");
    expect(describeLogPlatform("we‮b", null)).toBe("we�b");
  });

  it("describeLogPosition : 5 décimales à la française", () => {
    expect(describeLogPosition({ latitude: 48.8566, longitude: 2.3522 })).toBe("48,85660 ; 2,35220");
  });

  it("getDisplayedErrorMethod : masquée pour la source client", () => {
    expect(getDisplayedErrorMethod({ source: "client", method: "POST" })).toBeNull();
    expect(getDisplayedErrorMethod({ source: "server", method: "GET" })).toBe("GET");
    expect(getDisplayedErrorMethod({ source: "server", method: null })).toBeNull();
  });

  it("describeLogEntry et describeLogDetailTitle", () => {
    expect(describeLogEntry("errors", "2026-10-12T12:02:11Z")).toBe("l'erreur du 12/10/2026 14:02:11");
    expect(describeLogEntry("requests", "2026-10-12T12:02:11Z")).toBe("la requête du 12/10/2026 14:02:11");
    expect(describeLogDetailTitle("errors", 1840)).toBe("Détail de l'erreur n° 1840");
    expect(describeLogDetailTitle("requests", 7)).toBe("Détail de la requête n° 7");
  });
});

describe("LOG_MESSAGES", () => {
  it("couverture : ce qui n'est pas journalisé, IP du serveur, heures de Paris", () => {
    expect(LOG_MESSAGES.coverage).toContain("pages servies depuis le cache");
    expect(LOG_MESSAGES.coverage).toContain("l'adresse IP est celle du serveur de l'application");
    expect(LOG_MESSAGES.coverage).toContain("Heures affichées à Paris");
  });

  it("textes de l'écran, tutoiement absent des mentions factuelles, aucun appel à la suppression", () => {
    expect(LOG_MESSAGES.truncated(20_000, 30_004).replace(/[  ]/g, " ")).toBe(
      "Texte tronqué : 20 000 caractères affichés sur 30 004.",
    );
    const all = JSON.stringify(LOG_MESSAGES);
    expect(all).not.toMatch(/supprimer|purger maintenant|vider/i);
    expect(LOG_MESSAGES.detailMissing).toContain("purge automatique");
  });
});

describe("type ErrorLogEntry", () => {
  it("compile avec une entrée minimale", () => {
    const entry: ErrorLogEntry = {
      id: 1,
      occurredAt: "2026-10-12T12:00:00Z",
      source: "client",
      statusCode: null,
      message: "m",
      route: null,
      method: "POST",
      user: null,
      platform: null,
      os: null,
      context: null,
      position: null,
    };
    expect(entry.id).toBe(1);
  });
});
