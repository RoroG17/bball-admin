import type { Account, AccountAnomaly } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { getAccountAnomalies } from "@/models/getAccountAnomalies";

type AccountBadgesProps = { account: Account };

const ANOMALY_LABELS: Record<AccountAnomaly, string> = {
  unlinked: ACCOUNT_MESSAGES.badge.unlinked,
  ambiguousUsername: ACCOUNT_MESSAGES.badge.ambiguous,
};

const BADGE_CLASSES = "inline-flex items-center rounded-full border border-rpb-ink/40 px-[9px] py-px text-xs font-bold";

/** Pastilles de texte : « Administrateur », « Non rattaché », « Identifiant ambigu ». « — » s'il n'y en a aucune. */
export function AccountBadges({ account }: AccountBadgesProps) {
  const labels = [
    ...(account.role === "admin" ? [ACCOUNT_MESSAGES.badge.admin] : []),
    ...getAccountAnomalies(account).map((anomaly) => ANOMALY_LABELS[anomaly]),
  ];
  if (labels.length === 0) return <span aria-label="Aucune remarque">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label} className={BADGE_CLASSES}>
          {label}
        </li>
      ))}
    </ul>
  );
}
