"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Snackbar } from "@/components/ui/Snackbar";
import { respondAssignmentAction } from "@/app/site/w/actions";

export function OfferActions({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [hidden, setHidden] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError(null);
    const result = await respondAssignmentAction(assignmentId, accept);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "Алдаа гарлаа");
      return;
    }
    setHidden(true);
    setSnack(accept ? "Зөвшөөрлөө. Админ баталгаажуулна." : "Татгалзлаа");
    router.refresh();
  }

  if (hidden) {
    return (
      <p className="rounded-md bg-container px-3 py-2 text-[0.9em] font-medium text-ink">
        Хариу илгээгдлээ.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => respond(true)}
          loading={busy === "accept"}
          icon={<Check aria-hidden className="size-6" />}
          className="min-h-16 text-[1.05em]"
        >
          Зөвшөөрөх
        </Button>
        <Button
          variant="outline"
          onClick={() => respond(false)}
          loading={busy === "decline"}
          icon={<X aria-hidden className="size-6" />}
          className="min-h-16 text-[1.05em]"
        >
          Татгалзах
        </Button>
      </div>
      {error ? <p className="text-[0.9em] text-error">{error}</p> : null}
      <Snackbar open={Boolean(snack)} message={snack ?? ""} onClose={() => setSnack(null)} />
    </div>
  );
}
