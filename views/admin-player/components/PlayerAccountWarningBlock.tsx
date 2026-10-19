import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { getPlayerAccount } from "@/repositories/AdminPlayerRepository";

type PlayerAccountWarningBlockProps = {
  licence: string;
  token: string;
};

/**
 * Avertissement du formulaire de modification : le compte de connexion ne suit pas les changements de nom (P10). Lit
 * l'identifiant réel dans `GET /api/users`. Une lecture en échec n'empêche pas le formulaire (bloc isolé).
 */
export async function PlayerAccountWarningBlock({ licence, token }: PlayerAccountWarningBlockProps) {
  const account = await getPlayerAccount(licence, token);
  return (
    <SummaryNotice
      tone="light"
      icon="alert"
      message={
        account ? ADMIN_PLAYER_MESSAGES.accountWarning(account.username) : ADMIN_PLAYER_MESSAGES.accountWarningNone
      }
    />
  );
}
