import { HallOfFameView } from "@/views/hall-of-fame/HallOfFameView";

export default async function Page({ searchParams }: PageProps<"/hall-of-fame">) {
  const { mode } = await searchParams;
  return <HallOfFameView requestedMode={typeof mode === "string" ? mode : undefined} />;
}
