import Link from "next/link";
import type { AccountProtection } from "@/models/Account";
import { ACCOUNT_MESSAGES } from "@/models/accountMessages";
import { FormAlert } from "@/components/ui/FormAlert";

type AccountProtectedMessageProps = {
  protection: AccountProtection;
  listHref: string;
};

/** Page de confirmation ouverte à la main pour un compte protégé : message et retour, jamais de formulaire. */
export function AccountProtectedMessage({ protection, listHref }: AccountProtectedMessageProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert message={ACCOUNT_MESSAGES.protection[protection]} />
      <Link
        href={listHref}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-rpb-bordeaux underline underline-offset-[3px] hover:text-rpb-bordeaux-dark focus-ring"
      >
        Retour à la liste
      </Link>
    </div>
  );
}
