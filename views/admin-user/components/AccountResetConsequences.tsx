import type { Account } from "@/models/Account";
import { getAccountLabel } from "@/models/getAccountLabel";

type AccountResetConsequencesProps = { account: Account };

/** Ce que change une réinitialisation, dont ses limites (sessions non coupées, B4). */
export function AccountResetConsequences({ account }: AccountResetConsequencesProps) {
  const label = getAccountLabel(account);
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">Ce qui change</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px]/[22px]">
        <li>
          À sa prochaine connexion, {label} saisira son identifiant seul puis choisira un nouveau mot de passe.
        </li>
        <li>
          Tant que ce nouveau mot de passe n&apos;est pas choisi, toute personne qui connaît l&apos;identifiant «{" "}
          {account.username} » peut le définir : préviens {label} tout de suite.
        </li>
        <li>
          Les appareils déjà connectés le restent jusqu&apos;à l&apos;expiration de leur session (7 jours) : la
          réinitialisation ne les déconnecte pas.
        </li>
      </ul>
    </div>
  );
}
