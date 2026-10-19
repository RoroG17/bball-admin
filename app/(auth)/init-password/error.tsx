"use client";

import { AuthError } from "@/views/auth/components/AuthError";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AuthError onRetry={retry} />;
}
