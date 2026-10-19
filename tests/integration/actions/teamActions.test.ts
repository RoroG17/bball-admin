import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/sessionToken";
import { ADMIN_MESSAGES } from "@/models/adminMessages";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { TEAM_MESSAGES } from "@/models/teamMessages";
import { loadFixture, stubApi, type FetchCall } from "../helpers";

class RedirectError extends Error {}

const SECRET = "test-secret-test-secret-test-secret-0123";
const jar = vi.hoisted(() => ({ value: undefined as string | undefined }));
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "bball_session" && jar.value ? { name, value: jar.value } : undefined),
    has: (name: string) => name === "bball_session" && jar.value !== undefined,
  }),
  headers: async () => new Headers({ "x-bball-path": "/admin/team" }),
}));
vi.mock("next/cache", () => cache);
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof RedirectError) throw error;
  },
}));
// `cache()` de React ne s'applique qu'à l'intérieur d'un rendu : ici, chaque appel relit la source.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const { createTeam, deleteTeam, updateTeam } = await import("@/actions/teamActions");

const equipes = loadFixture<unknown[]>("equipes.json", "admin-team");
const required422 = loadFixture("equipe-422-required.json", "admin-team");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const writes = (calls: FetchCall[]) => calls.filter((call) => call.method !== "GET");

/** Liste des équipes en lecture ; l'écriture `method` répond `status` / `body` (appel enregistré dans `calls`). */
function stubTeams(method: "POST" | "PUT", status: number, body: unknown): FetchCall[] {
  const calls = stubApi({ "/api/equipes": equipes });
  const mock = vi.mocked(fetch);
  const base = mock.getMockImplementation()!;
  mock.mockImplementation(async (input, init) => {
    const response = await base(input, init);
    return init?.method === method ? new Response(JSON.stringify(body), { status }) : response;
  });
  return calls;
}

async function expectRedirect(promise: Promise<unknown>, url: string) {
  await expect(promise).rejects.toThrow(`REDIRECT:${url}`);
}

beforeEach(async () => {
  jar.value = await signSessionToken({ username: "admin", licence: null, token: "tok" }, SECRET);
  cache.revalidatePath.mockClear();
  cache.updateTag.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createTeam", () => {
  it("joueur : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubApi({ "/api/equipes": equipes });
    const state = await createTeam(IDLE_FORM_STATE, form({ name: "Nouvelle", logo: "" }));
    expect(state).toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });

  it("visiteur : redirigé vers la session expirée, aucun appel", async () => {
    jar.value = undefined;
    const calls = stubApi({});
    await expectRedirect(createTeam(IDLE_FORM_STATE, form({ name: "N", logo: "" })), "/session/expired?redirect=%2Fadmin%2Fteam");
    expect(calls).toHaveLength(0);
  });

  it("nom vide, 256 caractères, logo invalide : erreurs de champ, aucun appel", async () => {
    const calls = stubApi({ "/api/equipes": equipes });
    const empty = await createTeam(IDLE_FORM_STATE, form({ name: "  ", logo: "" }));
    expect(empty).toMatchObject({ status: "error", fieldErrors: { name: TEAM_MESSAGES.nameRequired } });
    const long = await createTeam(IDLE_FORM_STATE, form({ name: "a".repeat(256), logo: "" }));
    expect(long).toMatchObject({ fieldErrors: { name: TEAM_MESSAGES.nameTooLong } });
    const logo = await createTeam(IDLE_FORM_STATE, form({ name: "Ok", logo: "a/b.png" }));
    expect(logo).toMatchObject({ fieldErrors: { logo: TEAM_MESSAGES.logoInvalid }, values: { name: "Ok", logo: "a/b.png" } });
    expect(calls).toHaveLength(0);
  });

  it("doublon (casse et accents) : erreur sur le nom, aucun POST", async () => {
    const calls = stubApi({ "/api/equipes": equipes });
    const state = await createTeam(IDLE_FORM_STATE, form({ name: "us colomiers", logo: "" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { name: TEAM_MESSAGES.nameTaken("US Colomiers") } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("liste illisible : échec fermé, aucun POST", async () => {
    const calls = stubApi({ "/api/equipes": { status: 500, body: {} } });
    const state = await createTeam(IDLE_FORM_STATE, form({ name: "Nouvelle", logo: "" }));
    expect(state).toMatchObject({ status: "error", message: TEAM_MESSAGES.duplicateCheckUnavailable });
    expect(writes(calls)).toHaveLength(0);
  });

  it("succès : POST, rafraîchissement puis redirection avec l'identifiant", async () => {
    const calls = stubTeams("POST", 201, loadFixture("equipe-created-201.json", "admin-team"));
    await expectRedirect(
      createTeam(IDLE_FORM_STATE, form({ name: " Pibrac Basket Club ", logo: "" })),
      "/admin/team?notice=created&ref=17",
    );
    const [write] = writes(calls);
    expect(JSON.parse(write.body ?? "")).toEqual({ nom: "Pibrac Basket Club" });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/team");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("422 en anglais : erreur de champ française, jamais la phrase du back", async () => {
    stubTeams("POST", 422, required422);
    const state = await createTeam(IDLE_FORM_STATE, form({ name: "Nouvelle", logo: "" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { name: "Ce champ est obligatoire." } });
    expect(JSON.stringify(state)).not.toContain("The nom field");
  });

  it("500 : message serveur, pas de rafraîchissement", async () => {
    stubTeams("POST", 500, {});
    const state = await createTeam(IDLE_FORM_STATE, form({ name: "Nouvelle", logo: "" }));
    expect(state).toMatchObject({ status: "error", message: ADMIN_MESSAGES.serverWrite });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateTeam", () => {
  const fields = (overrides: Record<string, string> = {}) =>
    form({ id: "10", name: "US Colomiers 2", logo: "logo_colomiers.png", ...overrides });

  const stubWithPut = (status = 200, body: unknown = loadFixture("equipe-updated-200.json", "admin-team")) =>
    stubTeams("PUT", status, body);

  it("joueur : refusé sans aucun appel", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubApi({});
    expect(await updateTeam(IDLE_FORM_STATE, fields())).toMatchObject({ status: "error" });
    expect(calls).toHaveLength(0);
  });

  it("identifiant invalide ou équipe absente de la liste : « n'existe plus »", async () => {
    stubWithPut();
    expect(await updateTeam(IDLE_FORM_STATE, fields({ id: "abc" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(await updateTeam(IDLE_FORM_STATE, fields({ id: "999" }))).toMatchObject({ message: ADMIN_MESSAGES.gone });
  });

  it("logo vidé alors que l'équipe en a un : refus, aucun PUT", async () => {
    const calls = stubWithPut();
    const state = await updateTeam(IDLE_FORM_STATE, fields({ logo: "" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { logo: TEAM_MESSAGES.logoCannotBeCleared } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("logo vide alors que l'équipe n'en a pas : PUT sans logo", async () => {
    const calls = stubWithPut();
    await expectRedirect(updateTeam(IDLE_FORM_STATE, fields({ id: "12", name: "AS Labarthe", logo: "" })), "/admin/team?notice=updated&ref=12");
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({ nom: "AS Labarthe" });
  });

  it("renommage vers un doublon : refus", async () => {
    const calls = stubWithPut();
    const state = await updateTeam(IDLE_FORM_STATE, fields({ name: "Noé Carbonne Basket" }));
    expect(state).toMatchObject({ fieldErrors: { name: TEAM_MESSAGES.nameTaken("Noé Carbonne Basket") } });
    expect(writes(calls)).toHaveLength(0);
  });

  it("changement de logo seul avec le même nom : autorisé", async () => {
    const calls = stubWithPut();
    await expectRedirect(updateTeam(IDLE_FORM_STATE, fields({ name: "us colomiers", logo: "autre.png" })), "/admin/team?notice=updated&ref=10");
    expect(JSON.parse(writes(calls)[0].body ?? "")).toEqual({ nom: "us colomiers", logo: "autre.png" });
    expect(cache.revalidatePath).toHaveBeenCalled();
  });

  it("404 du back : « n'existe plus »", async () => {
    stubWithPut(404, { message: "Équipe non trouvée" });
    expect(await updateTeam(IDLE_FORM_STATE, fields())).toMatchObject({ status: "error", message: ADMIN_MESSAGES.gone });
  });
});

describe("deleteTeam", () => {
  const hidden = (id = "10") => form({ id });

  function stubDelete(status: number, body: unknown = { message: "Équipe supprimée" }) {
    const calls = stubApi({ "/api/equipes/10": { status, body } });
    return calls;
  }

  it("joueur : aucun DELETE", async () => {
    jar.value = await signSessionToken({ username: "lucas", licence: "LIC1000", token: "tok" }, SECRET);
    const calls = stubDelete(200);
    expect(await deleteTeam(IDLE_FORM_STATE, hidden())).toMatchObject({ status: "error", message: ADMIN_MESSAGES.forbidden });
    expect(calls).toHaveLength(0);
  });

  it("identifiant invalide : « n'existe plus », aucun appel", async () => {
    const calls = stubDelete(200);
    expect(await deleteTeam(IDLE_FORM_STATE, hidden("abc"))).toMatchObject({ message: ADMIN_MESSAGES.gone });
    expect(calls).toHaveLength(0);
  });

  it("200 : un seul DELETE, rafraîchissement (palmarès compris) et redirection sans ref", async () => {
    const calls = stubDelete(200);
    await expectRedirect(deleteTeam(IDLE_FORM_STATE, hidden()), "/admin/team?notice=deleted");
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["DELETE /api/equipes/10"]);
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/team");
    // C3 : les comptes des joueurs emportés disparaissent de la liste des comptes et du sélecteur.
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/user/create");
    expect(cache.updateTag).toHaveBeenCalledTimes(1);
  });

  it("404 : rafraîchit la liste puis « n'existe plus »", async () => {
    stubDelete(404, { message: "Équipe non trouvée" });
    expect(await deleteTeam(IDLE_FORM_STATE, hidden())).toMatchObject({ status: "error", message: ADMIN_MESSAGES.gone });
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/team");
  });

  it("500 (cascade `jouer` absente, B-ADM-1) : deleteFailed, pas de rafraîchissement", async () => {
    stubDelete(500, loadFixture("equipe-delete-500-stats.json", "admin-team"));
    expect(await deleteTeam(IDLE_FORM_STATE, hidden())).toMatchObject({ status: "error", message: ADMIN_MESSAGES.deleteFailed });
    expect(cache.revalidatePath).not.toHaveBeenCalled();
    expect(cache.updateTag).not.toHaveBeenCalled();
  });

  it("ne lit aucune donnée d'impact", async () => {
    const calls = stubDelete(200);
    await deleteTeam(IDLE_FORM_STATE, hidden()).catch(() => undefined);
    expect(calls.every((call) => call.method === "DELETE")).toBe(true);
  });
});
