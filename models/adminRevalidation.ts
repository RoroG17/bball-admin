import type { AdminEntity } from "@/models/AdminEntity";

export type AdminWriteKind = "create" | "update" | "delete";

/** Un chemin, ou un motif dynamique (`/player/[licence]`) dont le `type` est obligatoire pour `revalidatePath`. */
export type RevalidationTarget = string | { pattern: string; type: "page" | "layout" };

export type AdminRevalidationRule = {
  targets: readonly RevalidationTarget[];
  /** Écritures qui invalident aussi le palmarès (`updateTag`). */
  hallOfFameOn: readonly AdminWriteKind[];
};

/** Données pures (table fusionnée de `shared.md`), complétées par chaque feature. */
export const ADMIN_REVALIDATION: Record<Exclude<AdminEntity, "logs">, AdminRevalidationRule> = {
  player: {
    targets: [
      "/admin/player",
      "/player",
      { pattern: "/player/[licence]", type: "page" },
      "/",
      { pattern: "/game/[id]", type: "page" },
      { pattern: "/admin/season/[id]/edit", type: "page" },
      { pattern: "/admin/player/[licence]/edit", type: "page" },
      { pattern: "/admin/player/[licence]/created", type: "page" },
      "/admin/user",
      "/admin/user/create",
    ],
    hallOfFameOn: ["update", "delete"],
  },
  team: {
    targets: [
      "/admin/team",
      "/admin/team/create",
      "/admin/season",
      "/admin/season/create",
      "/admin/player",
      "/admin/player/create",
      "/admin/game",
      "/admin/game/create",
      "/",
      "/game",
      "/player",
      { pattern: "/player/[licence]", type: "page" },
      { pattern: "/game/[id]", type: "page" },
      { pattern: "/admin/season/[id]/edit", type: "page" },
      { pattern: "/admin/player/[licence]/edit", type: "page" },
      { pattern: "/admin/game/[id]/edit", type: "page" },
      "/admin/user",
      "/admin/user/create",
    ],
    hallOfFameOn: ["delete"],
  },
  season: {
    targets: [
      "/admin/season",
      { pattern: "/admin/season/[id]/edit", type: "page" },
      "/admin/game",
      "/",
      "/game",
      "/player",
      { pattern: "/player/[licence]", type: "page" },
    ],
    hallOfFameOn: ["delete"],
  },
  game: {
    targets: [
      "/admin/game",
      { pattern: "/admin/game/[id]/edit", type: "page" },
      "/game",
      { pattern: "/game/[id]", type: "page" },
      "/",
      { pattern: "/player/[licence]", type: "page" },
    ],
    hallOfFameOn: ["update", "delete"],
  },
  user: {
    targets: ["/admin/user", "/admin/user/create"],
    hallOfFameOn: [],
  },
};

/** Ajout / retrait d'un participant de saison : un seul mécanisme (C7). Pas de palmarès. */
export const SEASON_PARTICIPANT_REVALIDATION: readonly RevalidationTarget[] = [
  { pattern: "/admin/season/[id]/edit", type: "page" },
  "/",
  "/game",
  "/player",
  { pattern: "/player/[licence]", type: "page" },
];
