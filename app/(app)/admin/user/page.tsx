import { AdminUserListView } from "@/views/admin-user/AdminUserListView";

export default async function Page({ searchParams }: PageProps<"/admin/user">) {
  return <AdminUserListView rawQuery={await searchParams} />;
}
