import { GameDetailView } from "@/views/game-detail/GameDetailView";

export default async function Page({ params }: PageProps<"/game/[id]">) {
  const { id } = await params;
  return <GameDetailView rawGameId={id} />;
}
