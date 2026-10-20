"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Snackbar } from "@/components/ui/Snackbar";
import { saveWorkerNoteAction } from "@/lib/actions/admin";

const OUTCOMES = ["Холбогдсон", "Авсангүй", "Завгүй", "Дараа залгана"] as const;

/**
 * Field mode: after a call the admin records the outcome in one tap. The line
 * is appended to the private staff note (same RPC the note editor uses), so
 * nothing is stored outside the real database.
 */
export function ContactLogBar({ workerId, note }: { workerId: string; note: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  async function log(outcome: string) {
    setBusy(true);
    const stamp = new Intl.DateTimeFormat("mn-MN", {
      timeZone: "Asia/Ulaanbaatar",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    const line = `[${stamp}] Ярилцлага: ${outcome}`;
    const result = await saveWorkerNoteAction(workerId, note ? `${note}\n${line}` : line);
    setBusy(false);
    setSnack({
      message: result.ok ? `${outcome} — тэмдэглэгдлээ` : (result.error ?? "Алдаа гарлаа"),
      tone: result.ok ? "success" : "error",
    });
    if (result.ok) router.refresh();
  }

  return (
    <div
      data-contact-bar=""
      className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 border-t border-divider bg-surface px-3 py-2 sm:hidden"
    >
      <p className="mb-1.5 flex items-center gap-1.5 text-[0.8em] font-semibold text-muted">
        <Phone aria-hidden className="size-3.5" />
        Ярилцлага хэр болов?
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {OUTCOMES.map((outcome) => (
          <button
            key={outcome}
            type="button"
            disabled={busy}
            onClick={() => void log(outcome)}
            className="press min-h-11 rounded-[10px] border border-divider bg-surface px-2 text-[0.85em] font-medium disabled:opacity-50"
          >
            {outcome}
          </button>
        ))}
      </div>
      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />
    </div>
  );
}
