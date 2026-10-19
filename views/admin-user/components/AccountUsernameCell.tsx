import { CheckIcon } from "@/components/ui/icons/CheckIcon";

type AccountUsernameCellProps = {
  username: string;
  /** Compte qui vient d'être créé : pastille « Vient d'être enregistré » (le sens passe par le texte). */
  highlighted: boolean;
};

/** Identifiant en police à chasse fixe (lu tel quel, espaces compris). */
export function AccountUsernameCell({ username, highlighted }: AccountUsernameCellProps) {
  return (
    <div className="flex max-w-[260px] min-w-0 flex-col items-start gap-1">
      <code className="font-mono text-sm font-semibold wrap-anywhere whitespace-pre-wrap">{username}</code>
      {highlighted && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rpb-ink px-[9px] py-px text-xs font-bold text-rpb-gold">
          <CheckIcon size={14} strokeWidth={3} />
          Vient d&apos;être enregistré
        </span>
      )}
    </div>
  );
}
