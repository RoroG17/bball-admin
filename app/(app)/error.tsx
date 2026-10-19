"use client";

import { DashboardError } from "@/views/home/components/DashboardError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <DashboardError onRetry={retry} />;
}
