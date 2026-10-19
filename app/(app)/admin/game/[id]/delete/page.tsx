import { AdminGameDeleteView } from "@/views/admin-game/AdminGameDeleteView";

export default async function Page({ params }: PageProps<"/admin/game/[id]/delete">) {
  const { id } = await params;
  return <AdminGameDeleteView rawId={id} />;
}
