import { describe, expect, it } from "vitest";
import { createInitPasswordSchema } from "@/models/InitPasswordInput";
import { LoginInputSchema } from "@/models/LoginInput";

describe("LoginInputSchema", () => {
  it("nettoie l'identifiant et garde le mot de passe tel quel", () => {
    expect(LoginInputSchema.parse({ username: "  lucas  ", password: " a b " })).toEqual({
      username: "lucas",
      password: " a b ",
    });
  });

  it("transforme un mot de passe vide ou blanc en absence de mot de passe", () => {
    expect(LoginInputSchema.parse({ username: "lucas", password: "" }).password).toBeUndefined();
    expect(LoginInputSchema.parse({ username: "lucas", password: "  " }).password).toBeUndefined();
  });

  it.each([[""], ["   "], ["a".repeat(256)]])("refuse l'identifiant %j", (username) => {
    const result = LoginInputSchema.safeParse({ username, password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["username"], message: "Saisis ton identifiant." });
  });

  it("refuse un mot de passe démesuré", () => {
    expect(LoginInputSchema.safeParse({ username: "lucas", password: "a".repeat(1001) }).success).toBe(false);
  });
});

describe("createInitPasswordSchema", () => {
  const schema = createInitPasswordSchema("theo.bernard");
  const errorsOf = (password: string, confirmation = password) => {
    const result = schema.safeParse({ password, confirmation });
    return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
  };

  it("accepte un mot de passe de 8 caractères confirmé", () => {
    expect(errorsOf("abcdefgh")).toEqual({});
  });

  it("refuse 7 caractères", () => {
    expect(errorsOf("abcdefg")).toEqual({ password: "Le mot de passe doit contenir au moins 8 caractères." });
  });

  it("compte les caractères Unicode, pas les unités UTF-16", () => {
    expect(errorsOf("🏀🏀🏀🏀🏀🏀🏀")).toEqual({ password: "Le mot de passe doit contenir au moins 8 caractères." });
    expect(errorsOf("🏀🏀🏀🏀🏀🏀🏀🏀")).toEqual({});
  });

  it("limite à 72 octets UTF-8", () => {
    expect(errorsOf("a".repeat(72))).toEqual({});
    expect(errorsOf("a".repeat(73))).toEqual({ password: "Le mot de passe est trop long (72 octets maximum)." });
    // 18 émojis = 72 octets ; 19 = 76.
    expect(errorsOf("🏀".repeat(18))).toEqual({});
    expect(errorsOf("🏀".repeat(19))).toEqual({ password: "Le mot de passe est trop long (72 octets maximum)." });
  });

  it("refuse l'identifiant comme mot de passe, sans tenir compte de la casse", () => {
    expect(errorsOf("Theo.Bernard")).toEqual({
      password: "Le mot de passe ne doit pas être identique à l'identifiant.",
    });
  });

  it("exige une confirmation identique", () => {
    expect(errorsOf("abcdefgh", "")).toEqual({ confirmation: "Confirme le mot de passe." });
    expect(errorsOf("abcdefgh", "abcdefgH")).toEqual({
      confirmation: "Les deux mots de passe ne sont pas identiques.",
    });
  });
});
