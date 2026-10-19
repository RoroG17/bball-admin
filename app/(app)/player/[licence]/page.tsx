import { PlayerDetailView } from "@/views/player-detail/PlayerDetailView";

export default async function Page({ params, searchParams }: PageProps<"/player/[licence]">) {
  const { licence } = await params;
  const { saison, onglet } = await searchParams;
  return (
    <PlayerDetailView
      rawLicence={licence}
      requestedSeason={typeof saison === "string" ? saison : undefined}
      requestedTab={typeof onglet === "string" ? onglet : undefined}
    />
  );
}
