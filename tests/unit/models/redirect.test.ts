import { describe, expect, it } from "vitest";
import { buildLoginHref } from "@/models/buildLoginHref";
import { buildSessionExpiredHref } from "@/models/buildSessionExpiredHref";
import { parseLoginReason } from "@/models/parseLoginReason";
import { sanitizeRedirectPath } from "@/models/sanitizeRedirectPath";

describe("sanitizeRedirectPath", () => {
  it("garde un chemin interne avec ses paramètres", () => {
    expect(sanitizeRedirectPath("/game?saison=4")).toBe("/game?saison=4");
    expect(sanitizeRedirectPath("/")).toBe("/");
  });

  it.each([
    ["//evil.com"],
    ["/\\evil.com"],
    ["/a\\b"],
    ["https://evil.com"],
    ["javascript:alert(1)"],
    ["/\t/evil.com"],
    ["/\n/evil.com"],
    [" /x"],
    ["/a b"],
    [""],
    ["game"],
    ["/login"],
    ["/login?x=1"],
    ["/login/autre"],
    ["/init-password"],
    ["/session/expired?redirect=/"],
  ])("refuse %j", (raw) => {
    expect(sanitizeRedirectPath(raw)).toBe("/");
  });

  it("refuse les valeurs qui ne sont pas une chaîne unique", () => {
    expect(sanitizeRedirectPath(undefined)).toBe("/");
    expect(sanitizeRedirectPath(null)).toBe("/");
    expect(sanitizeRedirectPath(["/a", "/b"])).toBe("/");
  });

  it("refuse une chaîne trop longue", () => {
    expect(sanitizeRedirectPath(`/${"a".repeat(3000)}`)).toBe("/");
  });

  it("utilise le repli fourni", () => {
    expect(sanitizeRedirectPath("//evil.com", "/game")).toBe("/game");
  });

  it("accepte un chemin encodé, qui reste sur notre origine", () => {
    expect(sanitizeRedirectPath("/%2F%2Fevil.com")).toBe("/%2F%2Fevil.com");
  });

  it("retire le fragment et le paramètre interne _rsc", () => {
    expect(sanitizeRedirectPath("/a#frag")).toBe("/a");
    expect(sanitizeRedirectPath("/a?_rsc=abc&b=1")).toBe("/a?b=1");
    expect(sanitizeRedirectPath("/a?_rsc=abc")).toBe("/a");
  });

  it("ne refuse pas un chemin qui commence seulement comme /login", () => {
    expect(sanitizeRedirectPath("/loginfoo")).toBe("/loginfoo");
  });

  it("est idempotente", () => {
    for (const raw of ["/game?saison=4", "//evil.com", "/a?_rsc=1&b=2", "/a#x"]) {
      const once = sanitizeRedirectPath(raw);
      expect(sanitizeRedirectPath(once)).toBe(once);
    }
  });
});

describe("buildLoginHref", () => {
  it("renvoie l'URL canonique sans option ou avec /", () => {
    expect(buildLoginHref()).toBe("/login");
    expect(buildLoginHref({ redirect: "/" })).toBe("/login");
  });

  it("encode la page demandée", () => {
    expect(buildLoginHref({ redirect: "/game?saison=4" })).toBe("/login?redirect=%2Fgame%3Fsaison%3D4");
  });

  it("ajoute la raison", () => {
    expect(buildLoginHref({ reason: "expired" })).toBe("/login?reason=expired");
    expect(buildLoginHref({ reason: "expired", redirect: "/game" })).toBe("/login?reason=expired&redirect=%2Fgame");
  });

  it("ignore une redirection dangereuse", () => {
    expect(buildLoginHref({ redirect: "//evil.com" })).toBe("/login");
  });
});

describe("buildSessionExpiredHref", () => {
  it("encode le chemin assaini", () => {
    expect(buildSessionExpiredHref("/game?saison=4")).toBe("/session/expired?redirect=%2Fgame%3Fsaison%3D4");
    expect(buildSessionExpiredHref("//evil.com")).toBe("/session/expired?redirect=%2F");
  });
});

describe("parseLoginReason", () => {
  it("accepte les quatre raisons connues", () => {
    for (const reason of ["expired", "password-set", "activation-expired", "already-active"]) {
      expect(parseLoginReason(reason)).toBe(reason);
    }
  });

  it("refuse tout le reste", () => {
    expect(parseLoginReason(undefined)).toBeNull();
    expect(parseLoginReason("Texte libre")).toBeNull();
    expect(parseLoginReason("Expired")).toBeNull();
  });
});
