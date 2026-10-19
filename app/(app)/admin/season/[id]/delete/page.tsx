import { AdminSeasonDeleteView } from "@/views/admin-season/AdminSeasonDeleteView";

export default async function Page({ params }: PageProps<"/admin/season/[id]/delete">) {
  const { id } = await params;
  return <AdminSeasonDeleteView rawId={id} />;
}
