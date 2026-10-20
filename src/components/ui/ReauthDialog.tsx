"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { inputClass } from "./styles";

export type ReauthResult = { ok: boolean; error?: string };

export function ReauthDialog({
  open,
  onClose,
  onSubmit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<ReauthResult>;
  onSuccess?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await onSubmit(password);
    setLoading(false);
    if (result.ok) {
      setPassword("");
      onSuccess?.();
    } else {
      setError(result.error ?? "Нууц үг буруу байна");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Дахин баталгаажуулах">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-[0.9em] text-muted">Энэ үйлдэл чухал тул нууц үгээ дахин оруулна уу.</p>
        <label className="flex flex-col gap-1 text-[0.9em] font-medium">
          Нууц үг
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="press absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-md"
              aria-label={show ? "Нуух" : "Харуулах"}
            >
              {show ? (
                <EyeOff aria-hidden className="size-5" />
              ) : (
                <Eye aria-hidden className="size-5" />
              )}
            </button>
          </div>
        </label>
        {error ? (
          <p
            role="alert"
            className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" full onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" full loading={loading}>
            Баталгаажуулах
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
