import { AdminPlayerListView } from "@/views/admin-player/AdminPlayerListView";

export default async function Page({ searchParams }: PageProps<"/admin/player">) {
  return <AdminPlayerListView rawQuery={await searchParams} />;
}
