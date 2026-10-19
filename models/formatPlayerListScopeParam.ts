import { ALL_PLAYERS_PARAM, type PlayerListScope } from "@/models/PlayerListScope";

/** Valeur canonique de `?saison=` sur la liste. */
export function formatPlayerListScopeParam(scope: PlayerListScope): string {
  return scope.kind === "all" ? ALL_PLAYERS_PARAM : String(scope.season.id);
}
