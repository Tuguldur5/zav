"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { saveWorkerNoteAction } from "@/lib/actions/admin";

export function WorkerNoteEditor({ workerId, initial }: { workerId: string; initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setBusy(true);
    const result = await saveWorkerNoteAction(workerId, value);
    setBusy(false);
    setMessage({
      text: result.ok ? "Админ тэмдэглэл хадгалагдлаа" : (result.error ?? "Алдаа гарлаа"),
      ok: result.ok,
    });
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Админ тэмдэглэл (зөвхөн та л харна)
        <textarea
          rows={4}
          maxLength={1000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex gap-2">
        <Button onClick={save} loading={busy}>
          Хадгалах
        </Button>
        <Button variant="text" onClick={() => setValue(initial)}>
          Буцах
        </Button>
      </div>
      {message ? (
        <p className={message.ok ? "text-[0.9em] text-success" : "text-[0.9em] text-error"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
