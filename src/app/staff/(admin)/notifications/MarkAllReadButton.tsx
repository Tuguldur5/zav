"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markAllNotificationsReadAction } from "@/lib/actions/admin";

export function MarkAllReadButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-[0.9em] text-muted">Бүх мэдэгдэл уншсан болгогдлоо.</p>;
  }

  return (
    <Button
      variant="outline"
      loading={busy}
      icon={<CheckCheck aria-hidden className="size-5" />}
      onClick={async () => {
        setBusy(true);
        const result = await markAllNotificationsReadAction();
        setBusy(false);
        setDone(result.ok);
      }}
    >
      Бүгдийг уншсан болгох
    </Button>
  );
}
