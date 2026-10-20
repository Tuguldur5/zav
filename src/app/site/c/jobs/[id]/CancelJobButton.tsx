"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Snackbar } from "@/components/ui/Snackbar";
import { cancelJobAction } from "@/app/site/c/actions";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    const result = await cancelJobAction(jobId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Цуцлах боломжгүй");
      setOpen(false);
      return;
    }
    setOpen(false);
    setSnack(true);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" full onClick={() => setOpen(true)}>
        Зарыг цуцлах
      </Button>
      {error ? <p className="mt-2 text-[0.9em] text-error">{error}</p> : null}
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={cancel}
        loading={busy}
        message="Зарыг цуцлах уу? Цуцласны дараа буцаах боломжгүй."
        confirmLabel="Тийм, цуцлах"
      />
      <Snackbar open={snack} onClose={() => setSnack(false)} message="Зар цуцлагдлаа" />
    </>
  );
}
