"use client";

import { PlayerListError } from "@/views/player-list/components/PlayerListError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <PlayerListError onRetry={retry} />;
}
