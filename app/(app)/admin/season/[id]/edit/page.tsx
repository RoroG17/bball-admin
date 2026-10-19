import { AdminSeasonEditView } from "@/views/admin-season/AdminSeasonEditView";

export default async function Page({ params, searchParams }: PageProps<"/admin/season/[id]/edit">) {
  const { id } = await params;
  return <AdminSeasonEditView rawId={id} rawQuery={await searchParams} />;
}
