import type { Account } from "@/models/Account";
import { formatPlayerName } from "@/models/formatPlayerName";
import { getAccountLabel } from "@/models/getAccountLabel";

type AccountDeletionConsequencesProps = { account: Account };

/** Conséquences d'une suppression de compte (D-U6) : pas d'impact chiffré, le joueur est conservé. */
export function AccountDeletionConsequences({ account }: AccountDeletionConsequencesProps) {
  const label = getAccountLabel(account);
  const playerName = account.player ? formatPlayerName(account.player) || account.player.licence : null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">Ce qui change</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px]/[22px]">
        <li>
          {playerName
            ? `Le joueur ${playerName} et toutes ses statistiques sont conservés ; il pourra recevoir un nouveau compte.`
            : "Ce compte n'est rattaché à aucun joueur."}
        </li>
        <li>
          {label} ne pourra plus se connecter. Ses appareils déjà connectés le restent jusqu&apos;à l&apos;expiration de
          leur session (7 jours).
        </li>
        <li>Dans les journaux d&apos;activité, les actions de ce compte perdent leur auteur.</li>
      </ul>
    </div>
  );
}
