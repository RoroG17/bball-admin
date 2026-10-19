import { describe, expect, it } from "vitest";
import { joinMediaUrl } from "@/lib/joinMediaUrl";
import { buildMediaBaseUrl, buildMediaUrl } from "@/lib/mediaUrl";

const BASE = "http://api.test/public/images/logo/";

describe("joinMediaUrl", () => {
  it("null, undefined et vide donnent null", () => {
    expect(joinMediaUrl(BASE, null)).toBeNull();
    expect(joinMediaUrl(BASE, undefined)).toBeNull();
    expect(joinMediaUrl(BASE, "   ")).toBeNull();
  });

  it("encode un nom avec espace et accent", () => {
    expect(joinMediaUrl(BASE, " logo étoile 1.png ")).toBe(`${BASE}logo%20%C3%A9toile%201.png`);
  });
});

describe("buildMediaBaseUrl et buildMediaUrl", () => {
  it("la base se termine par un slash et buildMediaUrl l'utilise", () => {
    expect(buildMediaBaseUrl("logo")).toBe(BASE);
    expect(buildMediaBaseUrl("joueur")).toBe("http://api.test/public/images/joueur/");
    expect(buildMediaUrl("logo", "logo_frouzins.png")).toBe(`${BASE}logo_frouzins.png`);
    expect(buildMediaUrl("logo", null)).toBeNull();
  });
});
