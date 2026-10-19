import { SeasonSelector, type SeasonOption } from "@/components/ui/SeasonSelector";

type HomeHeaderProps = {
  options: SeasonOption[];
  selectedSeasonId: number;
  selectedSeasonLabel: string;
};

export function HomeHeader({ options, selectedSeasonId, selectedSeasonLabel }: HomeHeaderProps) {
  return (
    <div className="reveal flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-[.08em] text-rpb-bordeaux uppercase">
          Saison {selectedSeasonLabel}
        </p>
        <h1 className="font-display text-[40px] leading-[1.05] font-black">Tableau de bord</h1>
      </div>
      <SeasonSelector key={selectedSeasonId} options={options} selectedId={selectedSeasonId} basePath="/" />
    </div>
  );
}
