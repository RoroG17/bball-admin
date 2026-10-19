import { AdminTeamListView } from "@/views/admin-team/AdminTeamListView";

export default async function Page({ searchParams }: PageProps<"/admin/team">) {
  return <AdminTeamListView rawQuery={await searchParams} />;
}
