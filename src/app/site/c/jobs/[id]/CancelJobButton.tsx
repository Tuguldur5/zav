"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelJobAction } from "@/app/site/c/actions";
import { buttonCls, Note } from "@/components/public/ui";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function cancel() {
    setBusy(true);
    const result = await cancelJobAction(jobId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Цуцлах боломжгүй");
      setOpen(false);
      return;
    }
    setDone(true);
    setOpen(false);
    router.refresh();
  }

  if (done) return <Note tone="ok">Захиалга цуцлагдлаа.</Note>;

  return (
    <div className="flex flex-col gap-2">
      {error ? <Note tone="err">{error}</Note> : null}
      {open ? (
        <div className="flex flex-col gap-2 rounded-[8px] border border-divider p-3">
          <p className="text-[0.9em]">Захиалгыг цуцлах уу? Цуцласны дараа буцаах боломжгүй.</p>
          <div className="flex gap-2">
            <button type="button" onClick={cancel} disabled={busy} className={buttonCls("primary")}>
              {busy ? "Түр хүлээнэ үү…" : "Тийм, цуцлах"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className={buttonCls("secondary")}>
              Болих
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={buttonCls("secondary")}>
          Захиалга цуцлах
        </button>
      )}
    </div>
  );
}
