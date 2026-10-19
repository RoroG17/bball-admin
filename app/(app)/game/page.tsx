import { CalendarView } from "@/views/calendar/CalendarView";

export default async function Page({ searchParams }: PageProps<"/game">) {
  const { saison } = await searchParams;
  return <CalendarView requestedSeasonId={typeof saison === "string" ? saison : undefined} />;
}
