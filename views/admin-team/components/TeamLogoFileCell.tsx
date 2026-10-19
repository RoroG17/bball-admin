type TeamLogoFileCellProps = { file: string | null };

/** Nom du fichier de logo : information secondaire d'administration. */
export function TeamLogoFileCell({ file }: TeamLogoFileCellProps) {
  if (file === null) return <span className="text-rpb-ink/72">Aucun logo</span>;
  return (
    <code className="inline-block max-w-[220px] rounded-[4px] border border-rpb-ink/14 px-1.5 font-sans text-[13px]/5 wrap-anywhere tabular-nums">
      {file}
    </code>
  );
}
