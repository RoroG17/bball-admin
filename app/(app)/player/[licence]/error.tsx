"use client";

import { PlayerDetailError } from "@/views/player-detail/components/PlayerDetailError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <PlayerDetailError onRetry={retry} />;
}
