"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/styles";
import { forgotAction } from "@/app/site/auth/actions";
import { emailSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(forgotAction, {});
  const [emailError, setEmailError] = useState("");

  if (state.ok) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="rounded-md bg-success-container px-3 py-3 text-[0.9em] text-success">
          Хэрэв энэ и-мэйлээр бүртгэл байгаа бол сэргээх холбоос илгээлээ. И-мэйлээ шалгана уу.
        </p>
        <Link href="/login" className="text-primary underline underline-offset-2">
          Нэвтрэх хуудас руу
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        const value = String(new FormData(event.currentTarget).get("email") ?? "");
        if (!emailSchema.safeParse(value).success) {
          event.preventDefault();
          setEmailError("И-мэйл хаяг буруу байна");
        } else {
          setEmailError("");
        }
      }}
    >
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Бүртгэлтэй и-мэйл
        <input type="email" name="email" autoComplete="email" required className={inputClass} />
        {emailError ? <span className="text-error">{emailError}</span> : null}
      </label>
      <Button type="submit" full loading={pending}>
        Сэргээх холбоос илгээх
      </Button>
      <p className="text-center text-[0.9em]">
        <Link href="/login" className="text-primary underline underline-offset-2">
          Буцах
        </Link>
      </p>
    </form>
  );
}
