import { AdminUserDeleteView } from "@/views/admin-user/AdminUserDeleteView";

export default async function Page({ params }: PageProps<"/admin/user/[id]/delete">) {
  const { id } = await params;
  return <AdminUserDeleteView rawId={id} />;
}
