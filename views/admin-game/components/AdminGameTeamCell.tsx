type AdminGameTeamCellProps = { name: string; isRpb: boolean };

/** Nom de l'équipe, suivi du repère « RPB » en texte (jamais la couleur seule). */
export function AdminGameTeamCell({ name, isRpb }: AdminGameTeamCellProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-semibold wrap-anywhere">{name}</span>
      {isRpb && (
        <span className="rounded-md border border-rpb-bordeaux px-1.5 text-xs/5 font-bold text-rpb-bordeaux">RPB</span>
      )}
    </span>
  );
}
