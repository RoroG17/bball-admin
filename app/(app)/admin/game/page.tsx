import { AdminGameListView } from "@/views/admin-game/AdminGameListView";

export default async function Page({ searchParams }: PageProps<"/admin/game">) {
  return <AdminGameListView rawQuery={await searchParams} />;
}
