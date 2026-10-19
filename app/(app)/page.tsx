import { HomeView } from "@/views/home/HomeView";

export default async function Page({ searchParams }: PageProps<"/">) {
  const { saison } = await searchParams;
  return <HomeView requestedSeasonId={typeof saison === "string" ? saison : undefined} />;
}
