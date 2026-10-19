import { AdminLogsView } from "@/views/admin-logs/AdminLogsView";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AdminLogsView rawQuery={await searchParams} />;
}
