"use client";

import { useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ReauthAction } from "@/components/app/ReauthAction";
import { createInviteAction } from "@/lib/actions/super";
import { formatDateTimeMn } from "@/lib/dates";

export function InviteSection() {
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-semibold">
        <KeyRound aria-hidden className="size-5 text-primary" />
        Шинэ админ урилга
      </p>
      <p className="text-[0.9em] text-muted">
        Кодыг урьдагчдаа 48 цагийн дотор ашиглахыг хүснэ үү. Код зөвхөн нэг удаа харагдана.
      </p>
      <ReauthAction
        label="Урилгын код үүсгэх"
        variant="filled"
        action={createInviteAction}
        refresh={false}
        onSuccess={(result) => {
          const data = result.data as { code?: string; expires_at?: string } | undefined;
          if (data?.code) {
            setInvite({ code: data.code, expires_at: data.expires_at ?? "" });
            setCopied(false);
          }
        }}
      />

      {invite ? (
        <div className="rounded-md border-2 border-primary bg-primary-container p-3 text-on-primary-container">
          <p className="text-[0.8em] font-semibold uppercase">
            Урилгын код (зөвхөн одоо харагдана)
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="text-[1.35em] font-extrabold tracking-widest">{invite.code}</code>
            <Button variant="tonal" onClick={copy} icon={<Copy aria-hidden className="size-4" />}>
              {copied ? "Хуулагдлаа" : "Хуулах"}
            </Button>
          </div>
          {invite.expires_at ? (
            <p className="mt-1 text-[0.8em]">
              Хүчинтэй хугацаа: {formatDateTimeMn(invite.expires_at)}
            </p>
          ) : null}
          <p className="mt-1 break-all text-[0.8em]">Холбоос: /join?code={invite.code}</p>
        </div>
      ) : null}
    </Card>
  );
}
