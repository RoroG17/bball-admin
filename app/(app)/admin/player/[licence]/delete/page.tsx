import { AdminPlayerDeleteView } from "@/views/admin-player/AdminPlayerDeleteView";

export default async function Page({ params }: PageProps<"/admin/player/[licence]/delete">) {
  const { licence } = await params;
  return <AdminPlayerDeleteView rawLicence={licence} />;
}
