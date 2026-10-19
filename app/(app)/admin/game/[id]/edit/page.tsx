import { AdminGameEditView } from "@/views/admin-game/AdminGameEditView";

export default async function Page({ params }: PageProps<"/admin/game/[id]/edit">) {
  const { id } = await params;
  return <AdminGameEditView rawId={id} />;
}
