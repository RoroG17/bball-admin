import { Card } from "@/components/ui/Card";
import { SummaryNotice } from "@/components/ui/SummaryNotice";
import { ADMIN_PLAYER_MESSAGES } from "@/models/adminPlayerMessages";
import { getPlayerAccount } from "@/repositories/AdminPlayerRepository";

type PlayerCreatedAccountBlockProps = {
  licence: string;
  token: string;
};

/**
 * Identifiant de connexion du joueur, LU dans `GET /api/users` (jamais recalculé : casse, espaces et accents sont ceux
 * du back, D-P3). Compte introuvable (création partielle) → avertissement explicite. Données sensibles : texte
 * sélectionnable, jamais dans l'URL.
 */
export async function PlayerCreatedAccountBlock({ licence, token }: PlayerCreatedAccountBlockProps) {
  const account = await getPlayerAccount(licence, token);

  return (
    <Card title="Identifiant de connexion" strong>
      {account ? (
        <>
          <p className="flex flex-col gap-1">
            <span className="text-sm text-rpb-ink/72">Identifiant à communiquer au joueur</span>
            <strong
              data-testid="player-username"
              className="w-fit max-w-full rounded-lg border-2 border-rpb-ink bg-rpb-gold-light px-3.5 py-2 font-display text-2xl leading-tight font-black wrap-anywhere"
            >
              {account.username}
            </strong>
          </p>
          <p className="text-[15px]/[22px]">{ADMIN_PLAYER_MESSAGES.accountHint}</p>
          {account.hasPassword && <SummaryNotice tone="light" icon="check" message={ADMIN_PLAYER_MESSAGES.accountActivated} />}
        </>
      ) : (
        <SummaryNotice tone="light" icon="alert" message={ADMIN_PLAYER_MESSAGES.accountMissing} />
      )}
    </Card>
  );
}
