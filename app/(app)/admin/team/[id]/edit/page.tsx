import { AdminTeamEditView } from "@/views/admin-team/AdminTeamEditView";

export default async function Page({ params }: PageProps<"/admin/team/[id]/edit">) {
  const { id } = await params;
  return <AdminTeamEditView rawId={id} />;
}
