import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/session/expired/route";

const call = (query: string) => GET(new NextRequest(`http://localhost:3000/session/expired${query}`));

describe("GET /session/expired", () => {
  it("supprime les cookies et renvoie à la connexion avec la page d'origine", () => {
    const response = call("?redirect=%2Fgame%3Fsaison%3D4");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?reason=expired&redirect=%2Fgame%3Fsaison%3D4",
    );
    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toMatch(/bball_session=;/);
    expect(setCookie).toMatch(/bball_activation=;/);
  });

  it("ignore une redirection dangereuse", () => {
    expect(call("?redirect=//evil.com").headers.get("location")).toBe("http://localhost:3000/login?reason=expired");
  });

  it("sans paramètre", () => {
    expect(call("").headers.get("location")).toBe("http://localhost:3000/login?reason=expired");
  });
});
