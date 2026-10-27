"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { respondAssignmentAction } from "@/app/worker/(app)/actions";
import { buttonCls, Note } from "@/components/public/ui";

export function OfferActions({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"accept" | "decline" | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(accept: boolean) {
    setBusy(true);
    setError(null);
    const result = await respondAssignmentAction(assignmentId, accept);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Алдаа гарлаа");
      setConfirming(null);
      return;
    }
    setDone(accept ? "Зөвшөөрлөө. Админ баталгаажуулна." : "Татгалзлаа.");
    router.refresh();
  }

  if (done) return <Note tone="ok">{done}</Note>;

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[0.9em]">
          {confirming === "accept"
            ? "Энэ ажлыг авах уу? Админ баталгаажуулсны дараа хаяг харагдана."
            : "Энэ саналаас татгалзах уу?"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => respond(confirming === "accept")}
            disabled={busy}
            className={buttonCls(confirming === "accept" ? "primary" : "secondary")}
          >
            {busy ? "Түр хүлээнэ үү…" : "Тийм"}
          </button>
          <button type="button" onClick={() => setConfirming(null)} className={buttonCls("text")}>
            Болих
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setConfirming("accept")} className={buttonCls("primary")}>
          <Check aria-hidden className="size-4" strokeWidth={2} />
          Зөвшөөрөх
        </button>
        <button type="button" onClick={() => setConfirming("decline")} className={buttonCls("secondary")}>
          <X aria-hidden className="size-4" strokeWidth={2} />
          Татгалзах
        </button>
      </div>
      {error ? <p className="text-[0.9em] text-error">{error}</p> : null}
    </div>
  );
}
