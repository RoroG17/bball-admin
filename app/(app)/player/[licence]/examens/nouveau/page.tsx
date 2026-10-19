import { ExamCreateView } from "@/views/exam-create/ExamCreateView";

export default async function Page({ params }: PageProps<"/player/[licence]/examens/nouveau">) {
  const { licence } = await params;
  return <ExamCreateView rawLicence={licence} />;
}
