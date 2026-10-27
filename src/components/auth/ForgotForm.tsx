"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotAction } from "@/lib/actions/auth";
import type { AuthState } from "@/lib/auth-state";
import { buttonCls, Field, inputCls, Note } from "@/components/public/ui";

export function ForgotForm({ linkError }: { linkError?: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(forgotAction, {});

  if (state.ok) {
    return (
      <div className="flex flex-col gap-3">
        <Note tone="ok">
          Хэрэв энэ и-мэйл бүртгэлтэй бол сэргээх холбоос илгээгдлээ. И-мэйлээ шалгана уу.
        </Note>
        <Link href="/login" className={buttonCls("secondary", true)}>
          Нэвтрэх хуудас
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {linkError ? (
        <Note tone="err">
          Холбоосын хугацаа дууссан эсвэл өмнө ашигласан байна. Доор дахин хүсэлт гаргана уу.
        </Note>
      ) : null}
      {state.error ? <Note tone="err">{state.error}</Note> : null}
      <Field label="И-мэйл" error={state.fieldErrors?.email}>
        <input type="email" name="email" autoComplete="email" required className={inputCls} />
      </Field>
      <button type="submit" disabled={pending} className={buttonCls("primary", true)}>
        {pending ? "Түр хүлээнэ үү…" : "Холбоос авах"}
      </button>
      <Link href="/login" className="text-center text-[0.9em] text-primary underline underline-offset-2">
        Нэвтрэх хуудас руу буцах
      </Link>
    </form>
  );
}
