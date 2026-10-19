import { AdminTeamDeleteView } from "@/views/admin-team/AdminTeamDeleteView";

export default async function Page({ params }: PageProps<"/admin/team/[id]/delete">) {
  const { id } = await params;
  return <AdminTeamDeleteView rawId={id} />;
}
