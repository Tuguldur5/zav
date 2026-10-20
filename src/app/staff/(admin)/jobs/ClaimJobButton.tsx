"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Snackbar } from "@/components/ui/Snackbar";
import { claimJobAction } from "@/lib/actions/admin";

export function ClaimJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    const result = await claimJobAction(jobId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Авах боломжгүй");
      return;
    }
    router.push(`/jobs/${jobId}`);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={claim} loading={busy}>
        Авах
      </Button>
      {error ? (
        <>
          <p className="text-[0.9em] text-error">{error}</p>
          <Snackbar open tone="error" message={error} onClose={() => setError(null)} />
        </>
      ) : null}
    </div>
  );
}
