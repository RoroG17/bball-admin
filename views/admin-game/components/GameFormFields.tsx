import { AdminTextField } from "@/components/admin/AdminTextField";
import { GAME_MESSAGES } from "@/models/adminGameMessages";
import type { GameAckField } from "@/models/GameFormField";
import type { GameSeasonOption } from "@/models/GameSeasonOption";
import type { GameVideo } from "@/models/GameVideo";
import type { TeamOption } from "@/models/Team";
import type { GameFormInitialValues } from "@/models/toGameFormValues";
import { GameSeasonTeamsFields } from "@/views/admin-game/components/GameSeasonTeamsFields";
import { GameVideoField } from "@/views/admin-game/components/GameVideoField";
import { GameWarningAcknowledgement } from "@/views/admin-game/components/GameWarningAcknowledgement";

type GameFormFieldsProps = {
  mode: "create" | "update";
  seasons: readonly GameSeasonOption[];
  teams: readonly TeamOption[];
  values: GameFormInitialValues;
  teamsMode: "rpb" | "fixed";
  fixedTeams?: { home: string; away: string };
  /** Vidéo enregistrée (modification). */
  video?: GameVideo;
};

const CREATE_ACKS: readonly GameAckField[] = ["ackDuplicateRound", "ackDateOutsideSeason"];
const UPDATE_ACKS: readonly GameAckField[] = ["ackStatsMove", "ackDuplicateRound", "ackDateOutsideSeason", "ackScoreTie"];

/** Champs d'un match, communs à la création et à la modification (une seule source). */
export function GameFormFields({ mode, seasons, teams, values, teamsMode, fixedTeams, video }: GameFormFieldsProps) {
  return (
    <>
      <GameSeasonTeamsFields
        seasons={seasons}
        teams={teams}
        initial={{ seasonId: values.seasonId, side: values.side, opponentId: values.opponentId }}
        mode={teamsMode}
        fixedTeams={fixedTeams}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-5">
        <AdminTextField
          name="round"
          label="Journée"
          type="number"
          min={1}
          inputMode="numeric"
          defaultValue={values.round}
          required
          autoComplete="off"
        />
        <AdminTextField name="date" label="Date du match" type="date" defaultValue={values.date} required />
      </div>
      {mode === "update" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-5">
            <AdminTextField
              name="homeScore"
              label="Score domicile"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={values.homeScore}
              autoComplete="off"
            />
            <AdminTextField
              name="awayScore"
              label="Score extérieur"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={values.awayScore}
              autoComplete="off"
            />
          </div>
          <p className="-mt-2 text-[13px]/5 text-rpb-ink/72">{GAME_MESSAGES.scoresHint}</p>
          {video && <GameVideoField initialValue={values.video} current={video} />}
        </>
      )}
      {(mode === "update" ? UPDATE_ACKS : CREATE_ACKS).map((field) => (
        <GameWarningAcknowledgement key={field} field={field} />
      ))}
    </>
  );
}
