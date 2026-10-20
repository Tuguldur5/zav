"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ReauthDialog, type ReauthResult } from "@/components/ui/ReauthDialog";
import { Snackbar } from "@/components/ui/Snackbar";
import { reauthenticate } from "@/lib/actions/reauth";
import { changeOwnPasswordAction, updateOwnProfileAction } from "./actions";

function useSnack() {
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  return {
    snack,
    clear: () => setSnack(null),
    ok: (message: string) => setSnack({ message, tone: "success" }),
    fail: (message: string) => setSnack({ message, tone: "error" }),
  };
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [number, setNumber] = useState(phone);
  const [busy, setBusy] = useState(false);
  const snack = useSnack();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await updateOwnProfileAction({ fullName: name, phone: number });
    setBusy(false);
    if (result.ok) {
      snack.ok("Хадгаллаа");
      router.refresh();
    } else {
      snack.fail(result.error ?? "Алдаа гарлаа");
    }
  }

  return (
    <>
      <form onSubmit={save} className="flex flex-col gap-3">
        <Field label="Бүтэн нэр" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            name="fullName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Утасны дугаар" htmlFor="profile-phone" hint="8 оронтой, жишээ 99112233">
          <Input
            id="profile-phone"
            name="phone"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="99112233"
          />
        </Field>
        <div>
          <Button type="submit" loading={busy} icon={<Save aria-hidden className="size-4" />}>
            Хадгалах
          </Button>
        </div>
      </form>
      <Snackbar
        open={Boolean(snack.snack)}
        message={snack.snack?.message ?? ""}
        tone={snack.snack?.tone ?? "success"}
        onClose={snack.clear}
      />
    </>
  );
}

export function PasswordForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const snack = useSnack();

  async function reauth(value: string): Promise<ReauthResult> {
    const result = await reauthenticate(value);
    if (result.ok) {
      setConfirmed(true);
      setReauthOpen(false);
    }
    return result;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (password !== repeat) {
      snack.fail("Нууц үг таарахгүй байна");
      return;
    }
    setBusy(true);
    const result = await changeOwnPasswordAction(password);
    setBusy(false);
    if (result.ok) {
      setPassword("");
      setRepeat("");
      setConfirmed(false);
      snack.ok("Нууц үг солигдлоо");
    } else if (result.needsReauth) {
      setConfirmed(false);
      setReauthOpen(true);
    } else {
      snack.fail(result.error ?? "Алдаа гарлаа");
    }
  }

  return (
    <>
      {confirmed ? (
        <form onSubmit={save} className="flex flex-col gap-3">
          <p className="flex items-center gap-2 rounded-xl bg-tint-2 px-3 py-2 text-[13px]">
            <Check aria-hidden className="size-4" />
            Баталгаажлаа. Шинэ нууц үгээ оруулна уу.
          </p>
          <Field label="Шинэ нууц үг" htmlFor="new-password" hint="Дор хаяж 8 тэмдэгт">
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <Field label="Шинэ нууц үг давтах" htmlFor="repeat-password">
            <Input
              id="repeat-password"
              type="password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <div>
            <Button type="submit" loading={busy} icon={<KeyRound aria-hidden className="size-4" />}>
              Нууц үг солих
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-muted">
            Нууц үгээ солихын тулд эхлээд одоогийн нууц үгээр баталгаажуулна уу.
          </p>
          <div>
            <Button
              variant="tonal"
              onClick={() => setReauthOpen(true)}
              icon={<KeyRound aria-hidden className="size-4" />}
            >
              Нууц үг солих
            </Button>
          </div>
        </div>
      )}

      <ReauthDialog open={reauthOpen} onClose={() => setReauthOpen(false)} onSubmit={reauth} />
      <Snackbar
        open={Boolean(snack.snack)}
        message={snack.snack?.message ?? ""}
        tone={snack.snack?.tone ?? "success"}
        onClose={snack.clear}
      />
    </>
  );
}
