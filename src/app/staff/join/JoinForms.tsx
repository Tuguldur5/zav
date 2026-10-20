"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { joinAction, redeemAction } from "./actions";
import { fieldErrors, staffJoinSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";

export function JoinForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(joinAction, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const errors = { ...state.fieldErrors, ...clientErrors };

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = staffJoinSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
      code: formData.get("code"),
    });
    const nextErrors = parsed.success ? {} : fieldErrors(parsed.error);
    if (formData.get("consent") !== "on") {
      nextErrors.consent = "Үйлчилгээний нөхцөлийг зөвшөөрнө үү";
    }
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setClientErrors(nextErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Урилгын код
        <input
          name="code"
          defaultValue={code}
          autoComplete="one-time-code"
          required
          className={inputClass}
        />
        {errors.code ? <span className="text-error">{errors.code}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Нэр
        <input name="fullName" autoComplete="name" required className={inputClass} />
        {errors.fullName ? <span className="text-error">{errors.fullName}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Утасны дугаар
        <input
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          maxLength={12}
          required
          className={inputClass}
        />
        {errors.phone ? <span className="text-error">{errors.phone}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        И-мэйл
        <input type="email" name="email" autoComplete="email" required className={inputClass} />
        {errors.email ? <span className="text-error">{errors.email}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Нууц үг
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            className={inputClass}
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
        <span className="text-[0.8em] text-muted">Дор хаяж 8 тэмдэгт</span>
        {errors.password ? <span className="text-error">{errors.password}</span> : null}
      </label>

      <label className="flex min-h-[var(--control-h)] items-start gap-2 rounded-md border border-container bg-bg p-3 text-[0.9em]">
        <input type="checkbox" name="consent" required className="mt-0.5 size-5" />
        <span>
          Үйлчилгээний нөхцөл, нууцлалын журмыг зөвшөөрч байна.
          {errors.consent ? <span className="block text-error">{errors.consent}</span> : null}
        </span>
      </label>

      <Button type="submit" full loading={pending}>
        Кодоор нэгдэх
      </Button>

      <p className="text-center text-[0.9em] text-muted">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Нэвтрэх
        </Link>
      </p>
    </form>
  );
}

export function RedeemForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(redeemAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}
      <p className="rounded-md bg-container px-3 py-2 text-[0.9em]">
        Та аль хэдийн нэвтэрсэн байна. Урилгын кодоо оруулаад админ эрхээ идэвхжүүлнэ үү.
      </p>
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Урилгын код
        <input name="code" defaultValue={code} required className={inputClass} />
        {state.fieldErrors?.code ? (
          <span className="text-error">{state.fieldErrors.code}</span>
        ) : null}
      </label>
      <Button type="submit" full loading={pending}>
        Код ашиглах
      </Button>
    </form>
  );
}
