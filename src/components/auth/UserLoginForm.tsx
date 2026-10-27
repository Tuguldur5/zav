"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";
import { buttonCls, Field, inputCls, Note } from "@/components/public/ui";
import { FormGuards } from "./AuthBits";

export function UserLoginForm({
  next,
  formToken,
  timeout,
  authError,
  reset,
  otherSite,
}: {
  next?: string;
  formToken: string;
  timeout?: boolean;
  authError?: boolean;
  /** Arrived here after successfully setting a new password. */
  reset?: boolean;
  /** Absolute link to the other user host, built with siteUrl/workerUrl. */
  otherSite: { href: string; label: string };
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const errors = { ...state.fieldErrors, ...clientErrors };

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      event.preventDefault();
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setClientErrors(nextErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-4" noValidate>
      <FormGuards formToken={formToken} />
      {reset ? <Note tone="ok">Нууц үг солигдлоо. Шинэ нууц үгээрээ нэвтэрнэ үү.</Note> : null}
      {timeout ? <Note tone="warn">30 минут идэвхгүй байсан тул гарлаа. Дахин нэвтэрнэ үү.</Note> : null}
      {authError ? (
        <Note tone="err">
          И-мэйл холбоос хүчингүй, хугацаа дууссан эсвэл өөр хостод зориулагдсан байна. Нууц үгээ
          сэргээх хүсэлтийг дахин гаргана уу.
        </Note>
      ) : null}

      {state.hostMismatch || state.error === "host" ? (
        <div className="flex flex-col gap-2">
          <Note tone="err">
            Энэ хаягаар нэвтрэх боломжгүй байна. Нэвтрэх мэдээллээ шалгана уу.
          </Note>
          <a
            href={otherSite.href}
            className="text-[0.9em] font-medium text-primary underline underline-offset-2"
          >
            {otherSite.label}
          </a>
        </div>
      ) : state.error ? (
        <Note tone="err">{state.error}</Note>
      ) : null}

      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="И-мэйл" error={errors.email}>
        <input type="email" name="email" autoComplete="email" required className={inputCls} />
      </Field>

      <Field label="Нууц үг" error={errors.password}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 flex min-h-12 min-w-12 items-center justify-center rounded-[6px] text-muted"
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
          >
            {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
      </Field>

      <button type="submit" disabled={pending} className={buttonCls("primary", true)}>
        {pending ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
      </button>

      <div className="flex flex-col gap-2 text-[0.9em]">
        <Link href="/forgot-password" className="text-primary underline underline-offset-2">
          Нууц үгээ мартсан уу?
        </Link>
        <span className="text-muted">
          Бүртгэл байхгүй юу?{" "}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-primary underline underline-offset-2">
            Бүртгүүлэх
          </Link>
        </span>
      </div>
    </form>
  );
}
