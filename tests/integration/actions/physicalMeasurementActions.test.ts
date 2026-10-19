import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import type { AddMeasurementState } from "@/models/AddMeasurementState";
import { loadFixture, stubApi } from "../helpers";

const SECRET = "test-secret-test-secret-test-secret-0123";
const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && cookieJar.value ? { name, value: cookieJar.value } : undefined),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath }));

const { addPhysicalMeasurement } = await import("@/actions/physicalMeasurementActions");

const IDLE: AddMeasurementState = { status: "idle" };
const TODAY = "2026-03-12";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const valid = { licence: "LIC1000", date: "2026-02-10", type: "verticalJump", value: "62,5" };

/** Faux back : lecture des mesures + POST ; renvoie les appels et le corps du POST. */
function stubBack(post: { status?: number; body: unknown } = { status: 201, body: loadFixture("physics-cree.json", "player") }) {
  let postedBody: unknown = null;
  const calls = stubApi({ "/physics/LIC1000": loadFixture("physics.json", "player"), "/api/physics": post });
  const fetchMock = vi.mocked(fetch);
  const original = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (input, init) => {
    if (init?.method === "POST") postedBody = JSON.parse(String(init.body));
    return original(input, init);
  });
  return { calls, posted: () => postedBody };
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00+01:00`));
  cookieJar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET);
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("addPhysicalMeasurement", () => {
  it("refuse un joueur ou un visiteur sans rien envoyer (P3)", async () => {
    const { calls } = stubBack();
    cookieJar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const asPlayer = await addPhysicalMeasurement(IDLE, form(valid));
    expect(asPlayer).toMatchObject({ status: "error", message: "Action réservée aux administrateurs." });
    cookieJar.value = undefined;
    expect(await addPhysicalMeasurement(IDLE, form(valid))).toMatchObject({ status: "error" });
    expect(calls).toEqual([]);
  });

  it("renvoie les erreurs par champ et la saisie, sans appel au back", async () => {
    const { calls } = stubBack();
    const state = await addPhysicalMeasurement(IDLE, form({ ...valid, date: "2026-03-13", value: "200" }));
    expect(state).toEqual({
      status: "error",
      message: null,
      fieldErrors: {
        date: "La date ne peut pas être dans le futur.",
        value: "La détente doit être comprise entre 5 et 120 cm.",
      },
      values: { date: "2026-03-13", type: "verticalJump", value: "200" },
    });
    expect(calls).toEqual([]);
  });

  it("refuse un doublon même type / même date, sans POST (D9)", async () => {
    const { calls } = stubBack();
    const state = await addPhysicalMeasurement(IDLE, form({ ...valid, date: "2026-01-15" }));
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { date: "Une mesure de détente existe déjà à cette date (46 cm)." },
    });
    expect(calls.map((call) => call.path)).toEqual(["/physics/LIC1000"]);
  });

  it("enregistre, revalide la fiche et renvoie la mesure", async () => {
    const { calls, posted } = stubBack();
    const state = await addPhysicalMeasurement(IDLE, form(valid));
    expect(posted()).toEqual({ date_physics: "2026-02-10", type: "spring", value: 62.5, licence: "LIC1000" });
    const post = calls.find((call) => call.path === "/api/physics")!;
    expect(post.headers.get("Accept")).toBe("application/json");
    expect(post.headers.get("Authorization")).toBe("Bearer tok");
    expect(revalidatePath).toHaveBeenCalledWith("/player/LIC1000");
    expect(state).toEqual({
      status: "success",
      measurement: { id: "f3b1c2d4-0000-4000-8000-000000000001", date: "2026-02-10", type: "verticalJump", value: 62.5 },
    });
  });

  it("reporte un 422 sur les champs", async () => {
    stubBack({ status: 422, body: loadFixture("physics-422.json", "player") });
    const state = await addPhysicalMeasurement(IDLE, form(valid));
    expect(state).toMatchObject({
      status: "error",
      message: null,
      fieldErrors: { value: "The value field must be a number." },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("licence refusée par le back ou 404 → « Ce joueur n'existe plus. »", async () => {
    stubBack({ status: 422, body: { message: "x", errors: { licence: ["The selected licence is invalid."] } } });
    expect(await addPhysicalMeasurement(IDLE, form(valid))).toMatchObject({ message: "Ce joueur n'existe plus." });
    stubBack({ status: 404, body: { message: "Not found" } });
    expect(await addPhysicalMeasurement(IDLE, form(valid))).toMatchObject({ message: "Ce joueur n'existe plus." });
  });

  it("500 ou réseau → message générique, sans exception", async () => {
    stubBack({ status: 500, body: {} });
    expect(await addPhysicalMeasurement(IDLE, form(valid))).toMatchObject({
      status: "error",
      message: "Échec de l'enregistrement. Vérifie ta connexion puis réessaie.",
    });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await addPhysicalMeasurement(IDLE, form(valid))).toMatchObject({
      status: "error",
      message: "Échec de l'enregistrement. Vérifie ta connexion puis réessaie.",
    });
  });
});
