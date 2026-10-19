"use client";

import { AdminPageError } from "@/components/admin/AdminPageError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AdminPageError onRetry={retry} />;
}
