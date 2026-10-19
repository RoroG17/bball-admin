import { AdminPlayerCreatedView } from "@/views/admin-player/AdminPlayerCreatedView";

export default async function Page({ params }: PageProps<"/admin/player/[licence]/created">) {
  const { licence } = await params;
  return <AdminPlayerCreatedView rawLicence={licence} />;
}
