import { SeasonSelector, type SeasonOption } from "@/components/ui/SeasonSelector";

type PlayerListHeaderProps = {
  options: SeasonOption[];
  selectedId: number | string;
  /** « Saison 2025-2026 · D1 · U15G » ou « Tous les joueurs ». */
  scopeLabel: string;
};

export function PlayerListHeader({ options, selectedId, scopeLabel }: PlayerListHeaderProps) {
  return (
    <div className="reveal flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">{scopeLabel}</p>
        <h1 className="font-display text-[40px] leading-[1.05] font-black">Joueurs</h1>
      </div>
      <SeasonSelector key={selectedId} options={options} selectedId={selectedId} basePath="/player" />
    </div>
  );
}
