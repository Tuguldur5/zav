"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { AuthAlert, FormGuards, SubmitButton, TextField } from "./AuthBits";
import { mn } from "@/lib/i18n/mn";
import type { AuthState } from "@/lib/auth-state";

const copy = mn.marketing.auth;

export function LoginPanel({
  next,
  formToken,
  onSwitch,
}: {
  next?: string;
  formToken: string;
  /** Provided by the dialog; the full page uses real links instead. */
  onSwitch?: () => void;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="relative flex flex-col gap-4" noValidate>
      <FormGuards formToken={formToken} />
      <input type="hidden" name="next" value={next ?? ""} />

      {state.error ? <AuthAlert>{state.error}</AuthAlert> : null}

      <TextField
        label={copy.email}
        htmlFor="login-email"
        error={errors.email}
        input={{
          id: "login-email",
          name: "email",
          type: "email",
          autoComplete: "email",
          inputMode: "email",
          required: true,
          maxLength: 254,
        }}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-[0.92em] font-medium">
          {copy.password}
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={72}
            className="auth-field pr-12"
            aria-invalid={Boolean(errors.password) || undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted"
            aria-label={showPassword ? mn.auth.hidePassword : mn.auth.showPasswordToggle}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
        {errors.password ? <span className="text-[0.82em] text-err">{errors.password}</span> : null}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-[0.9em] text-primary underline underline-offset-2"
        >
          {copy.forgot}
        </Link>
      </div>

      <SubmitButton pending={pending}>{copy.submitLogin}</SubmitButton>

      <p className="text-center text-[0.9em] text-muted">
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="text-primary underline underline-offset-2">
            {copy.switchToRegister}
          </button>
        ) : (
          <Link href="/register" className="text-primary underline underline-offset-2">
            {copy.switchToRegister}
          </Link>
        )}
      </p>
    </form>
  );
}
