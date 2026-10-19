import { AdminUserCreateView } from "@/views/admin-user/AdminUserCreateView";

export default async function Page({ searchParams }: PageProps<"/admin/user/create">) {
  return <AdminUserCreateView rawQuery={await searchParams} />;
}
