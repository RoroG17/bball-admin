import { AdminPlayerEditView } from "@/views/admin-player/AdminPlayerEditView";

export default async function Page({ params }: PageProps<"/admin/player/[licence]/edit">) {
  const { licence } = await params;
  return <AdminPlayerEditView rawLicence={licence} />;
}
