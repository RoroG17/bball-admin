import { AdminGameCreateView } from "@/views/admin-game/AdminGameCreateView";

export default async function Page({ searchParams }: PageProps<"/admin/game/create">) {
  return <AdminGameCreateView rawQuery={await searchParams} />;
}
