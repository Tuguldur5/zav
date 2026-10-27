"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { loginSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";

type LoginAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

/** Staff-host login. User hosts use UserLoginForm. */
export function LoginForm({
  action,
  next,
  timeout,
  authError,
  reset,
  staff = false,
}: {
  action: LoginAction;
  next?: string;
  timeout?: boolean;
  authError?: boolean;
  /** Arrived here after successfully setting a new password. */
  reset?: boolean;
  staff?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
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
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0])] = issue.message;
      }
      setClientErrors(nextErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-4" noValidate>
      {reset ? (
        <p className="rounded-md bg-success-container px-3 py-2 text-[0.9em] text-success">
          Нууц үг солигдлоо. Шинэ нууц үгээрээ нэвтэрнэ үү.
        </p>
      ) : null}
      {timeout ? (
        <p className="rounded-md bg-warm px-3 py-2 text-[0.9em] text-warm-ink">
          30 минут идэвхгүй байсан тул гарлаа. Дахин нэвтэрнэ үү.
        </p>
      ) : null}
      {authError ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          И-мэйл холбоос хүчингүй, хугацаа дууссан эсвэл өөр хостод зориулагдсан байна. Нууц үгээ
          сэргээх хүсэлтийг дахин гаргана уу.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="next" value={next ?? ""} />

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        И-мэйл
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className={inputClass}
          aria-invalid={Boolean(errors.email) || undefined}
        />
        {errors.email ? <span className="text-error">{errors.email}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Нууц үг
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            className={inputClass}
            aria-invalid={Boolean(errors.password) || undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="press absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-md"
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
        {errors.password ? <span className="text-error">{errors.password}</span> : null}
      </label>

      <Button type="submit" full loading={pending}>
        Нэвтрэх
      </Button>

      <div className="flex flex-col gap-2 text-center text-[0.9em]">
        {staff ? (
          <Link href="/forgot-password" className="text-primary underline underline-offset-2">
            Нууц үгээ мартсан уу?
          </Link>
        ) : (
          <Link href="/forgot-password" className="text-primary underline underline-offset-2">
            Нууц үгээ мартсан уу?
          </Link>
        )}
        {staff ? (
          <Link href="/join" className="text-primary underline underline-offset-2">
            Кодоор нэгдэх
          </Link>
        ) : null}
      </div>
    </form>
  );
}
