import { forbidden, redirect } from "next/navigation";
import { Suspense } from "react";
import { BlockErrorBoundary } from "@/components/ui/BlockErrorBoundary";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { formatPlayerListScopeParam } from "@/models/formatPlayerListScopeParam";
import { formatSeasonLabel } from "@/models/formatSeasonLabel";
import { ALL_PLAYERS_PARAM } from "@/models/PlayerListScope";
import { resolvePlayerListScope } from "@/models/resolvePlayerListScope";
import { sortSeasonsByRecency } from "@/models/sortSeasonsByRecency";
import { listAccessibleSeasons } from "@/repositories/SeasonRepository";
import { requireSession } from "@/repositories/SessionRepository";
import { PlayerListHeader } from "@/views/player-list/components/PlayerListHeader";
import { PLAYER_LIST_MAIN_CLASSES } from "@/views/player-list/components/playerListLayout";
import { PlayerListNoSeasonState } from "@/views/player-list/components/PlayerListNoSeasonState";
import { PlayerListSection } from "@/views/player-list/components/PlayerListSection";

type PlayerListViewProps = {
  /** Valeur brute de `?saison=` : identifiant, « tous » ou absent. */
  requestedScope: string | undefined;
};

export async function PlayerListView({ requestedScope }: PlayerListViewProps) {
  const session = await requireSession();

  // Un joueur n'a pas accès à la liste : « Joueurs » ouvre directement sa fiche.
  if (session.role !== "admin") {
    if (!session.licence) forbidden();
    redirect(buildPlayerHref(session.licence));
  }

  const seasons = sortSeasonsByRecency(await listAccessibleSeasons(session));
  const scope = resolvePlayerListScope(seasons, requestedScope, session.role);
  if (!scope) {
    return (
      <main className={`anim ${PLAYER_LIST_MAIN_CLASSES}`}>
        <PlayerListNoSeasonState />
      </main>
    );
  }

  // L'URL reflète toujours ce qui est affiché (paramètre absent, invalide ou hors périmètre).
  const param = formatPlayerListScopeParam(scope);
  if (requestedScope !== param) redirect(`/player?saison=${param}`);

  const options = [
    ...seasons.map((season) => ({ id: season.id, label: formatSeasonLabel(season) })),
    ...(session.role === "admin" ? [{ id: ALL_PLAYERS_PARAM, label: "Tous les joueurs" }] : []),
  ];

  return (
    <main className={`anim ${PLAYER_LIST_MAIN_CLASSES}`}>
      <PlayerListHeader
        options={options}
        selectedId={scope.kind === "all" ? ALL_PLAYERS_PARAM : scope.season.id}
        scopeLabel={scope.kind === "all" ? "Tous les joueurs" : `Saison ${formatSeasonLabel(scope.season)}`}
      />
      <BlockErrorBoundary title="Joueurs">
        <Suspense key={param} fallback={<SkeletonCard cards={8} />}>
          <PlayerListSection scope={scope} />
        </Suspense>
      </BlockErrorBoundary>
    </main>
  );
}
