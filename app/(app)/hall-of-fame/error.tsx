"use client";

import { HallOfFameError } from "@/views/hall-of-fame/components/HallOfFameError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <HallOfFameError onRetry={retry} />;
}
