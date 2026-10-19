import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { IDLE_FORM_STATE, formError } from "@/models/FormState";
import { readFormValues } from "@/models/readFormValues";
import { zodErrorToFormState } from "@/models/zodErrorToFormState";

const FIELDS = ["name", "city"] as const;

describe("readFormValues", () => {
  it("lit chaque champ, sans trim", () => {
    const data = new FormData();
    data.set("name", "  Lucas ");
    data.set("city", "Paris");
    expect(readFormValues(data, FIELDS)).toEqual({ name: "  Lucas ", city: "Paris" });
  });

  it("champ absent ou fichier → chaîne vide", () => {
    const data = new FormData();
    data.set("city", new File(["x"], "x.txt"));
    expect(readFormValues(data, FIELDS)).toEqual({ name: "", city: "" });
  });

  it("ignore les champs non déclarés", () => {
    const data = new FormData();
    data.set("name", "a");
    data.set("password", "secret");
    expect(readFormValues(data, FIELDS)).toEqual({ name: "a", city: "" });
  });
});

describe("formError / IDLE_FORM_STATE", () => {
  it("construit un état d'erreur", () => {
    const values = { name: "a", city: "b" };
    expect(formError(values, "oups")).toEqual({ status: "error", message: "oups", fieldErrors: {}, values });
    expect(formError(values, null, { name: "x" })).toEqual({
      status: "error",
      message: null,
      fieldErrors: { name: "x" },
      values,
    });
  });

  it("l'état initial est idle", () => {
    expect(IDLE_FORM_STATE).toEqual({ status: "idle" });
  });
});

describe("zodErrorToFormState", () => {
  const schema = z.object({ name: z.string().min(2, "Nom trop court"), city: z.string().min(1, "Ville requise") });
  const values = { name: "a", city: "" };

  it("garde la première erreur de chaque champ et ajoute « Corrige les champs signalés »", () => {
    const result = schema.safeParse(values);
    if (result.success) throw new Error("attendu : échec");
    expect(zodErrorToFormState(result.error, FIELDS, values)).toEqual({
      status: "error",
      message: ADMIN_MESSAGES.fixFields,
      fieldErrors: { name: "Nom trop court", city: "Ville requise" },
      values,
    });
  });

  it("garde bien la première erreur quand un champ en a plusieurs", () => {
    const multi = z.object({ name: z.string().min(5, "Trop court").regex(/^\d+$/, "Chiffres seulement") });
    const result = multi.safeParse({ name: "ab" });
    if (result.success) throw new Error("attendu : échec");
    expect(zodErrorToFormState(result.error, FIELDS, values).fieldErrors).toEqual({ name: "Trop court" });
  });

  it("une issue sans champ connu devient le message global", () => {
    const refined = z.object({ name: z.string() }).refine(() => false, "Règle globale");
    const result = refined.safeParse({ name: "a" });
    if (result.success) throw new Error("attendu : échec");
    expect(zodErrorToFormState(result.error, FIELDS, values)).toEqual({
      status: "error",
      message: "Règle globale",
      fieldErrors: {},
      values,
    });
  });

  it("un champ hors liste est traité comme une issue sans champ", () => {
    const other = z.object({ licence: z.string().min(3, "Licence courte") });
    const result = other.safeParse({ licence: "a" });
    if (result.success) throw new Error("attendu : échec");
    expect(zodErrorToFormState(result.error, FIELDS, values)).toMatchObject({
      message: "Licence courte",
      fieldErrors: {},
    });
  });

  it("garde le message d'une issue globale quand il y a aussi des erreurs de champ", () => {
    const mixed = z.object({ name: z.string().min(2, "Nom trop court") }).check((ctx) => {
      ctx.issues.push({ code: "custom", message: "Règle globale", input: ctx.value });
    });
    const result = mixed.safeParse({ name: "a" });
    if (result.success) throw new Error("attendu : échec");
    const state = zodErrorToFormState(result.error, FIELDS, values);
    expect(state.fieldErrors).toEqual({ name: "Nom trop court" });
    expect(state.message).toBe("Règle globale");
  });
});
