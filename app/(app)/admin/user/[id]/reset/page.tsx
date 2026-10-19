import { AdminUserResetView } from "@/views/admin-user/AdminUserResetView";

export default async function Page({ params }: PageProps<"/admin/user/[id]/reset">) {
  const { id } = await params;
  return <AdminUserResetView rawId={id} />;
}
