import { describe, expect, it } from "vitest";
import { ADMIN_MESSAGES, BACK_KIND_MESSAGES } from "@/models/adminMessages";
import { classifyBackMessage } from "@/models/classifyBackMessage";
import { mapWriteFailure } from "@/models/mapWriteFailure";
import type { WriteFailure } from "@/models/WriteFailure";

describe("classifyBackMessage", () => {
  it.each([
    ["The licence has already been taken.", "taken"],
    ["The nom field is required.", "required"],
    ["The nom field must be present.", "required"],
    ["The nom field must not be greater than 255 characters.", "tooLong"],
    ["The nom may not be greater than 255 characters.", "tooLong"],
    ["The selected equipe is invalid.", "unknownReference"],
    ["The selected Id_Saison does not exist.", "unknownReference"],
    ["The value is wrong.", "invalid"],
    ["", "invalid"],
  ] as const)("« %s » → %s", (message, kind) => {
    expect(classifyBackMessage(message)).toBe(kind);
  });

  it("est insensible à la casse", () => {
    expect(classifyBackMessage("THE LICENCE HAS ALREADY BEEN TAKEN.")).toBe("taken");
  });

  it("un « characters » seul ne suffit pas pour tooLong", () => {
    expect(classifyBackMessage("The nom must contain 3 characters.")).toBe("invalid");
  });
});

describe("mapWriteFailure", () => {
  const values = { name: "Colomiers", logo: "x.png" };
  const options = { fieldMap: { nom: "name", logo_file: "logo" } as const };

  it("invalid : champ mappé → erreur de champ en français", () => {
    const failure: WriteFailure = { kind: "invalid", errors: { nom: ["The nom has already been taken."] } };
    const state = mapWriteFailure(failure, values, options);
    expect(state).toEqual({
      status: "error",
      message: ADMIN_MESSAGES.fixFields,
      fieldErrors: { name: BACK_KIND_MESSAGES.taken },
      values,
    });
  });

  it("invalid : plusieurs champs mappés", () => {
    const failure: WriteFailure = {
      kind: "invalid",
      errors: { nom: ["The nom field is required."], logo_file: ["The logo file is invalid."] },
    };
    const state = mapWriteFailure(failure, values, options);
    expect(state.fieldErrors).toEqual({ name: BACK_KIND_MESSAGES.required, logo: BACK_KIND_MESSAGES.invalid });
  });

  it("invalid : champ non mappé → message « rejected » une seule fois", () => {
    const failure: WriteFailure = { kind: "invalid", errors: { autre: ["x"], encore: ["y"] } };
    const state = mapWriteFailure(failure, values, options);
    expect(state.message).toBe(ADMIN_MESSAGES.rejected);
    expect(state.fieldErrors).toEqual({});
  });

  it("invalid : mappé + non mappé → champ et message « rejected »", () => {
    const failure: WriteFailure = { kind: "invalid", errors: { nom: ["The nom has already been taken."], autre: ["x"] } };
    const state = mapWriteFailure(failure, values, options);
    expect(state.fieldErrors).toEqual({ name: BACK_KIND_MESSAGES.taken });
    expect(state.message).toBe(ADMIN_MESSAGES.rejected);
  });

  it("invalid sans aucune erreur → « rejected »", () => {
    expect(mapWriteFailure({ kind: "invalid", errors: {} }, values, options).message).toBe(ADMIN_MESSAGES.rejected);
  });

  it("fieldMessages est prioritaire sur le texte par défaut", () => {
    const failure: WriteFailure = { kind: "invalid", errors: { nom: ["The nom has already been taken."] } };
    const state = mapWriteFailure(failure, values, {
      ...options,
      fieldMessages: { name: { taken: "Une équipe porte déjà ce nom." } },
    });
    expect(state.fieldErrors.name).toBe("Une équipe porte déjà ce nom.");
  });

  it("fieldMessages ne couvre que les types listés", () => {
    const failure: WriteFailure = { kind: "invalid", errors: { nom: ["The nom field is required."] } };
    const state = mapWriteFailure(failure, values, { ...options, fieldMessages: { name: { taken: "x" } } });
    expect(state.fieldErrors.name).toBe(BACK_KIND_MESSAGES.required);
  });

  it("notFound : message par défaut ou fourni", () => {
    const failure: WriteFailure = { kind: "notFound", backMessage: "Équipe non trouvée" };
    expect(mapWriteFailure(failure, values, options).message).toBe(ADMIN_MESSAGES.gone);
    expect(mapWriteFailure(failure, values, { ...options, notFoundMessage: "Cette équipe a disparu." }).message).toBe(
      "Cette équipe a disparu.",
    );
  });

  it("forbidden, conflict, failed réseau / serveur", () => {
    expect(mapWriteFailure({ kind: "forbidden" }, values, options).message).toBe(ADMIN_MESSAGES.forbidden);
    expect(mapWriteFailure({ kind: "conflict" }, values, options).message).toBe(ADMIN_MESSAGES.conflict);
    expect(mapWriteFailure({ kind: "failed", reason: "network" }, values, options).message).toBe(
      ADMIN_MESSAGES.networkWrite,
    );
    expect(mapWriteFailure({ kind: "failed", reason: "server" }, values, options).message).toBe(
      ADMIN_MESSAGES.serverWrite,
    );
  });

  it("conserve la saisie et n'expose jamais la phrase du back", () => {
    const failures: WriteFailure[] = [
      { kind: "invalid", errors: { nom: ["The nom has already been taken."], autre: ["Secret backend phrase"] } },
      { kind: "notFound", backMessage: "Secret backend phrase" },
    ];
    for (const failure of failures) {
      const state = mapWriteFailure(failure, values, options);
      expect(state.values).toBe(values);
      expect(JSON.stringify(state)).not.toMatch(/Secret|already been taken/);
    }
  });
});
