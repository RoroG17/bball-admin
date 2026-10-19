import { SummaryNotice } from "@/components/ui/SummaryNotice";

/** Compte sans joueur (D7) : explique pourquoi aucune saison n'apparaît. */
export function NoLinkedPlayerNotice() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-5">
      <div role="status">
        <SummaryNotice
          tone="light"
          message="Ton compte n'est pas rattaché à un joueur, donc aucune saison n'est disponible. Demande à un administrateur de le rattacher."
        />
      </div>
    </div>
  );
}
