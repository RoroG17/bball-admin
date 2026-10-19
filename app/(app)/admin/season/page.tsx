import { AdminSeasonListView } from "@/views/admin-season/AdminSeasonListView";

export default async function Page({ searchParams }: PageProps<"/admin/season">) {
  return <AdminSeasonListView rawQuery={await searchParams} />;
}
