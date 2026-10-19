import { beforeEach, describe, expect, it, vi } from "vitest";
import { HALL_OF_FAME_CACHE_TAG } from "@/lib/cacheTags";
import { ADMIN_REVALIDATION, SEASON_PARTICIPANT_REVALIDATION } from "@/models/adminRevalidation";

const cache = vi.hoisted(() => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("next/cache", () => cache);

const { refreshAfterAdminWrite } = await import("@/actions/support/refreshAfterAdminWrite");
const { refreshAfterSeasonParticipantChange } = await import("@/actions/support/refreshAfterSeasonParticipantChange");

beforeEach(() => {
  cache.revalidatePath.mockClear();
  cache.updateTag.mockClear();
});

describe("refreshAfterAdminWrite", () => {
  it("revalide chaque chemin de l'entité, un motif dynamique avec son type", () => {
    refreshAfterAdminWrite("season", "update");
    expect(cache.revalidatePath.mock.calls).toEqual([
      ["/admin/season"],
      ["/admin/season/[id]/edit", "page"],
      ["/admin/game"],
      ["/"],
      ["/game"],
      ["/player"],
      ["/player/[licence]", "page"],
    ]);
  });

  it("n'invalide le palmarès que pour les écritures de hallOfFameOn", () => {
    refreshAfterAdminWrite("player", "create");
    expect(cache.updateTag).not.toHaveBeenCalled();
    refreshAfterAdminWrite("player", "update");
    refreshAfterAdminWrite("player", "delete");
    expect(cache.updateTag).toHaveBeenCalledTimes(2);
    expect(cache.updateTag).toHaveBeenCalledWith(HALL_OF_FAME_CACHE_TAG);
  });

  it("appelle revalidatePath pour toutes les cibles de chaque entité", () => {
    for (const entity of ["player", "team", "season", "game", "user"] as const) {
      cache.revalidatePath.mockClear();
      refreshAfterAdminWrite(entity, "delete");
      expect(cache.revalidatePath).toHaveBeenCalledTimes(ADMIN_REVALIDATION[entity].targets.length);
    }
  });

  it("game : le palmarès est invalidé à la modification et à la suppression, pas à la création", () => {
    refreshAfterAdminWrite("game", "create");
    expect(cache.updateTag).not.toHaveBeenCalled();
    refreshAfterAdminWrite("game", "update");
    expect(cache.updateTag).toHaveBeenCalledTimes(1);
  });

  it("user : jamais de palmarès", () => {
    refreshAfterAdminWrite("user", "delete");
    expect(cache.updateTag).not.toHaveBeenCalled();
    expect(cache.revalidatePath.mock.calls).toEqual([["/admin/user"], ["/admin/user/create"]]);
  });
});

describe("refreshAfterSeasonParticipantChange (C7)", () => {
  it("revalide les cibles des participants, sans le palmarès", () => {
    refreshAfterSeasonParticipantChange();
    expect(cache.revalidatePath).toHaveBeenCalledTimes(SEASON_PARTICIPANT_REVALIDATION.length);
    expect(cache.revalidatePath).toHaveBeenCalledWith("/admin/season/[id]/edit", "page");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/player/[licence]", "page");
    expect(cache.updateTag).not.toHaveBeenCalled();
  });
});

describe("refreshAfterAdminWrite : équipes", () => {
  it("création et modification : formulaires, listes et pages dynamiques rafraîchis, palmarès intact", () => {
    for (const kind of ["create", "update"] as const) {
      cache.revalidatePath.mockClear();
      cache.updateTag.mockClear();
      refreshAfterAdminWrite("team", kind);
      const calls = cache.revalidatePath.mock.calls;
      for (const path of ["/admin/team", "/admin/season/create", "/admin/player/create", "/admin/game/create", "/admin/user", "/game"]) {
        expect(calls).toContainEqual([path]);
      }
      expect(calls).toContainEqual(["/player/[licence]", "page"]);
      expect(calls).toContainEqual(["/game/[id]", "page"]);
      expect(cache.updateTag).not.toHaveBeenCalled();
    }
  });

  it("suppression : palmarès invalidé", () => {
    refreshAfterAdminWrite("team", "delete");
    expect(cache.updateTag).toHaveBeenCalledWith(HALL_OF_FAME_CACHE_TAG);
  });
});
