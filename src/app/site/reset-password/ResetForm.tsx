"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { resetAction } from "@/app/site/auth/actions";
import type { AuthState } from "@/lib/auth-state";

export function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resetAction, {});
  const [show, setShow] = useState(false);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Шинэ нууц үг
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="press absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-md"
            aria-label={show ? "Нууц үг нуух" : "Нууц үг харуулах"}
          >
            {show ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
        <span className="text-[0.8em] text-muted">Дор хаяж 8 тэмдэгт</span>
        {errors.password ? <span className="text-error">{errors.password}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Шинэ нууц үг давтах
        <input
          type={show ? "text" : "password"}
          name="confirm"
          autoComplete="new-password"
          required
          className={inputClass}
        />
        {errors.confirm ? <span className="text-error">{errors.confirm}</span> : null}
      </label>

      <Button type="submit" full loading={pending}>
        Нууц үг шинэчлэх
      </Button>
    </form>
  );
}
