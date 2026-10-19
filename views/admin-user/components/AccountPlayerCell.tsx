import Link from "next/link";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { buildPlayerHref } from "@/models/buildPlayerHref";
import { getAccountLabel } from "@/models/getAccountLabel";

type AccountPlayerCellProps = { account: Account };

/** Lien vers la fiche du joueur rattaché, sinon « Aucun joueur ». */
export function AccountPlayerCell({ account }: AccountPlayerCellProps) {
  if (account.player === null) return <span className="text-rpb-ink/72">{ACCOUNT_MESSAGES.noPlayer}</span>;
  return (
    <Link
      href={buildPlayerHref(account.player.licence)}
      className="text-[15px]/[22px] font-bold wrap-anywhere text-rpb-bordeaux underline-offset-[3px] hover:underline focus-ring"
    >
      {getAccountLabel(account)}
    </Link>
  );
}
