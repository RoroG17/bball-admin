import { PlayerListView } from "@/views/player-list/PlayerListView";

export default async function Page({ searchParams }: PageProps<"/player">) {
  const { saison } = await searchParams;
  return <PlayerListView requestedScope={typeof saison === "string" ? saison : undefined} />;
}
