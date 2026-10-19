import { SummaryNotice } from "@/components/ui/SummaryNotice";
import type { Account } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { getAccountAnomalies } from "@/models/getAccountAnomalies";
import { getAccountLabel } from "@/models/getAccountLabel";

type AccountCreatedNoticeProps = { account: Account };

/** Identifiant à communiquer après une création, plus l'avertissement « non rattaché » s'il y a lieu. */
export function AccountCreatedNotice({ account }: AccountCreatedNoticeProps) {
  const label = getAccountLabel(account);
  return (
    <div className="flex flex-col gap-2">
      <SummaryNotice
        tone="light"
        icon="check"
        message={`Identifiant à communiquer à ${label} : ${account.username}. À sa première connexion, il saisira cet identifiant seul puis choisira son mot de passe.`}
      />
      {getAccountAnomalies(account).includes("unlinked") && (
        <SummaryNotice tone="light" icon="alert" message={ACCOUNT_MESSAGES.unlinkedWarning} />
      )}
    </div>
  );
}
