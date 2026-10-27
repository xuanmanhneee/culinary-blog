"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { getErrorMessage } from "@/lib/errors";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="site-container py-24"><ErrorState message={getErrorMessage(error)} onRetry={reset} /></div>;
}
