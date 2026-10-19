"use client";

import { CalendarError } from "@/views/calendar/components/CalendarError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <CalendarError onRetry={retry} />;
}
