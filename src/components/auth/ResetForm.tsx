"use client";

import { useActionState, useState } from "react";
import { resetAction } from "@/lib/actions/auth";
import type { AuthState } from "@/lib/auth-state";
import { buttonCls, Field, inputCls, Note } from "@/components/public/ui";

export function ResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resetAction, {});
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <Note tone="err">{state.error}</Note> : null}

      <Field label="Шинэ нууц үг" hint="Дор хаяж 8 тэмдэгт" error={state.fieldErrors?.password}>
        <input
          type={show ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          required
          className={inputCls}
        />
      </Field>

      <Field label="Шинэ нууц үг давтах" error={state.fieldErrors?.confirm}>
        <input
          type={show ? "text" : "password"}
          name="confirm"
          autoComplete="new-password"
          required
          className={inputCls}
        />
      </Field>

      <label className="flex items-center gap-2 text-[0.9em]">
        <input
          type="checkbox"
          checked={show}
          onChange={(event) => setShow(event.target.checked)}
          className="size-4"
        />
        Нууц үгээ харуулах
      </label>

      <button type="submit" disabled={pending} className={buttonCls("primary", true)}>
        {pending ? "Түр хүлээнэ үү…" : "Нууц үг хадгалах"}
      </button>
    </form>
  );
}
