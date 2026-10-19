"use client";

import { useId, useState, type ChangeEvent } from "react";
import { AdminSelectField } from "@/components/admin/AdminSelectField";
import { AlertTriangleIcon } from "@/components/ui/icons/AlertTriangleIcon";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import { GAME_SIDE_LABELS } from "@/models/gameSideLabels";
import type { GameSeasonOption } from "@/models/GameSeasonOption";
import type { TeamOption } from "@/models/Team";
import { toTeamSelectOptions } from "@/models/toTeamSelectOptions";

type GameSeasonTeamsFieldsProps = {
  seasons: readonly GameSeasonOption[];
  teams: readonly TeamOption[];
  initial: { seasonId: string; side: string; opponentId: string };
  /** `rpb` : côté + adversaire ; `fixed` : match hérité qui n'oppose pas le RPB de sa saison, équipes en lecture seule (D-G4). */
  mode: "rpb" | "fixed";
  fixedTeams?: { home: string; away: string };
};

const SIDE_OPTIONS = (Object.entries(GAME_SIDE_LABELS) as [string, string][]).map(([value, label]) => ({ value, label }));

/**
 * Saison, côté de l'équipe RPB et adversaire. L'équipe RPB vient de la saison choisie : l'indice et la liste des
 * adversaires suivent la saison (changement observé par bulle depuis le `<select>`, sans toucher à `AdminSelectField`).
 * Les équipes du match sont recalculées par le serveur : ce composant ne fait que guider la saisie.
 */
export function GameSeasonTeamsFields({ seasons, teams, initial, mode, fixedTeams }: GameSeasonTeamsFieldsProps) {
  const [seasonId, setSeasonId] = useState(initial.seasonId);
  const hintId = useId();
  const season = seasons.find((candidate) => String(candidate.id) === seasonId);
  const rpbTeamId = season?.rpbTeamId ?? null;

  function handleChange(event: ChangeEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.name === "seasonId") setSeasonId(target.value);
  }

  const opponents = toTeamSelectOptions(teams.filter((team) => team.id !== rpbTeamId));
  const hasRpbTeam = season !== undefined && rpbTeamId !== null;

  return (
    <div onChange={handleChange} className="flex flex-col gap-5">
      <AdminSelectField
        name="seasonId"
        label="Saison"
        defaultValue={initial.seasonId}
        options={seasons.map((option) => ({ value: String(option.id), label: option.label }))}
        placeholder="Choisis une saison…"
        required
      />
      {mode === "rpb" ? (
        <>
          <p
            id={hintId}
            aria-live="polite"
            className="flex items-start gap-2 text-[13px]/5 font-semibold text-rpb-ink"
          >
            {season === undefined ? null : hasRpbTeam ? (
              GAME_MESSAGES.rpbTeamHint(season.rpbTeamName ?? `Équipe n° ${rpbTeamId}`)
            ) : (
              <>
                <AlertTriangleIcon size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-danger" />
                {GAME_MESSAGES.noRpbTeamHint}
              </>
            )}
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-5">
            <AdminSelectField
              name="side"
              label="Côté de l'équipe RPB"
              defaultValue={initial.side}
              options={SIDE_OPTIONS}
              placeholder={GAME_MESSAGES.sidePlaceholder}
              required
            />
            <AdminSelectField
              name="opponentId"
              label="Équipe adverse"
              defaultValue={initial.opponentId}
              options={opponents}
              placeholder={GAME_MESSAGES.opponentPlaceholder}
              required
              hint={opponents.length === 0 ? GAME_MESSAGES.noOtherTeam : undefined}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-base font-semibold">
            Domicile : {fixedTeams?.home ?? "—"} · Extérieur : {fixedTeams?.away ?? "—"}
          </p>
          <SummaryNotice tone="light" message={GAME_MESSAGES.legacyTeamsNotice} />
        </div>
      )}
    </div>
  );
}
