import { createAccount } from "@/actions/accountActions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminTextField } from "@/components/admin/AdminTextField";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { LINK_ON_CREATE_SUPPORTED, USERNAME_MAX_LENGTH } from "@/models/AccountRules";
import type { AccountField } from "@/models/AccountInput";
import { buildAccountCreateHref } from "@/models/buildAccountCreateHref";
import { buildAccountUsername } from "@/models/buildAccountUsername";
import { buildAdminHref } from "@/models/buildAdminHref";
import { listPlayersWithoutAccount } from "@/models/listPlayersWithoutAccount";
import { listAccounts } from "@/repositories/AccountRepository";
import { listAllPlayers } from "@/repositories/PlayerRepository";
import { AccountPlayerPicker } from "@/views/admin-user/components/AccountPlayerPicker";
import { AccountSelectedPlayer } from "@/views/admin-user/components/AccountSelectedPlayer";

type AccountCreateBlockProps = {
  q: string;
  licence: string | null;
  token: string;
};

/**
 * Sélecteur de joueur puis formulaire. Joueurs ET comptes sont requis : une lecture en échec fait échouer le bloc
 * (« Réessayer »), jamais un choix de joueurs vide trompeur.
 */
export async function AccountCreateBlock({ q, licence, token }: AccountCreateBlockProps) {
  const [players, accounts] = await Promise.all([listAllPlayers(), listAccounts(token)]);
  const available = listPlayersWithoutAccount(players, accounts);
  const selected = licence === null ? null : (available.find((entry) => entry.player.licence === licence) ?? null);

  return (
    <div className="flex flex-col gap-6">
      <AccountPlayerPicker players={available} q={q} selectedLicence={selected?.player.licence ?? null} />
      {licence !== null && selected === null && (
        <SummaryNotice tone="light" icon="alert" message={ACCOUNT_MESSAGES.playerNotAvailable} />
      )}
      {selected && <AccountSelectedPlayer entry={selected} clearHref={buildAccountCreateHref({ q })} />}
      <div className="flex flex-wrap items-start gap-5">
        <AdminForm<AccountField>
          key={selected?.player.licence ?? "aucun"}
          action={createAccount}
          submitLabel="Créer le compte"
          busyLabel="Création…"
          cancelHref={buildAdminHref("user")}
        >
          <input type="hidden" name="joueur" value={selected?.player.licence ?? ""} />
          <AdminTextField
            name="username"
            label="Identifiant"
            required
            maxLength={USERNAME_MAX_LENGTH}
            defaultValue={selected ? buildAccountUsername(selected.player) : ""}
            hint="Lettres, chiffres, point, tiret et tiret bas. Tu peux modifier la suggestion."
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {!LINK_ON_CREATE_SUPPORTED && selected && (
            <SummaryNotice tone="light" icon="alert" message={ACCOUNT_MESSAGES.linkNotSavedWarning} />
          )}
          {!selected && <SummaryNotice tone="light" message={ACCOUNT_MESSAGES.noPlayerHint} />}
        </AdminForm>
      </div>
    </div>
  );
}
