"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/styles";
import { setSettingAction } from "@/lib/actions/super";

export function SettingsForm({
  initialPhone,
  initialText,
}: {
  initialPhone: string;
  initialText: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save(key: "support_phone" | "support_text", value: string) {
    setBusy(true);
    const result = await setSettingAction(key, value.trim());
    setBusy(false);
    setMessage({ text: result.ok ? "Хадгаллаа" : (result.error ?? "Алдаа гарлаа"), ok: result.ok });
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[0.9em] font-medium">
          Тусламжийн утас
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            className={inputClass}
            placeholder="+976 7000 1234"
          />
        </label>
        <Button
          onClick={() => void save("support_phone", phone)}
          loading={busy}
          icon={<Save aria-hidden className="size-5" />}
        >
          Утас хадгалах
        </Button>
      </Card>

      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[0.9em] font-medium">
          Тусламжийн мессеж
          <textarea
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={inputClass}
          />
        </label>
        <Button
          onClick={() => void save("support_text", text)}
          loading={busy}
          icon={<Save aria-hidden className="size-5" />}
        >
          Мессеж хадгалах
        </Button>
      </Card>

      {message ? (
        <p className={message.ok ? "text-[0.9em] text-success" : "text-[0.9em] text-error"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
