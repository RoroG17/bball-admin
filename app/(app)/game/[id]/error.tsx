"use client";

import { GameDetailError } from "@/views/game-detail/components/GameDetailError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <GameDetailError onRetry={retry} />;
}
