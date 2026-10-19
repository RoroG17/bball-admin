import Link from "next/link";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { ADMIN_LIST_SEARCH_MAX_LENGTH } from "@/models/AdminListQuery";
import { buildAccountCreateHref } from "@/models/buildAccountCreateHref";
import { filterPlayersByName } from "@/models/filterPlayersByName";
import { limitPickerPlayers } from "@/models/limitPickerPlayers";
import { pluralize } from "@/lib/format";
import type { PlayerListEntry } from "@/models/PlayerListEntry";
import { AccountPlayerOption } from "@/views/admin-user/components/AccountPlayerOption";

type AccountPlayerPickerProps = {
  /** Joueurs sans compte (déjà écartés ceux qui en ont un). */
  players: readonly PlayerListEntry[];
  q: string;
  selectedLicence: string | null;
};

const CREATE_PATH = buildAccountCreateHref({});

/**
 * Choix facultatif du joueur, piloté par l'URL : recherche (formulaire GET) et liste de liens, 50 au plus. Aucun
 * `<select>` de plusieurs dizaines d'options, aucun état client.
 */
export function AccountPlayerPicker({ players, q, selectedLicence }: AccountPlayerPickerProps) {
  const matching = filterPlayersByName(players, q);
  const { shown, total } = limitPickerPlayers(matching);

  return (
    <section aria-labelledby="picker-title" className="flex flex-col gap-3">
      <h2 id="picker-title" className="font-display text-xl font-extrabold">
        Joueur (facultatif)
      </h2>
      <form method="get" action={CREATE_PATH} role="search" aria-label="Rechercher un joueur" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-[2_1_260px]">
          <TextField
            label="Rechercher un joueur"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={ADMIN_LIST_SEARCH_MAX_LENGTH}
            autoComplete="off"
          />
        </div>
        {selectedLicence && <input type="hidden" name="joueur" value={selectedLicence} />}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <PrimaryButton size="tall" type="submit">
            Rechercher
          </PrimaryButton>
          {q !== "" && (
            <Link
              href={buildAccountCreateHref({ licence: selectedLicence })}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
            >
              Effacer la recherche
            </Link>
          )}
        </div>
      </form>
      {players.length === 0 ? (
        <p className="font-bold">{ACCOUNT_MESSAGES.allPlayersHaveAccount}</p>
      ) : shown.length === 0 ? (
        <p className="font-bold">{ACCOUNT_MESSAGES.noPlayerMatch(q)}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px]/5 text-rpb-ink/72 tabular-nums">
            {total > shown.length
              ? ACCOUNT_MESSAGES.pickerTruncated(shown.length, total)
              : `${pluralize(total, "joueur", "joueurs")} sans compte`}
          </p>
          <ul className="flex max-h-[420px] flex-col overflow-y-auto border-t-2 border-rpb-ink">
            {shown.map((entry) => (
              <AccountPlayerOption
                key={entry.player.licence}
                entry={entry}
                q={q}
                selected={entry.player.licence === selectedLicence}
              />
            ))}
          </ul>
        </div>
      )}
      <p className="text-[13px]/5 text-rpb-ink/72">{ACCOUNT_MESSAGES.noTeamHint}</p>
    </section>
  );
}
