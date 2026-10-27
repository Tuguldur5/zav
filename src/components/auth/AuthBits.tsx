"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/** Errors appear next to the field and in a polite live region. */
export function AuthAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "ok" }) {
  return (
    <p
      aria-live="polite"
      className={
        tone === "ok"
          ? "rounded-[8px] bg-ok-bg px-3 py-2 text-[0.92em] text-ok"
          : "rounded-[8px] bg-err-bg px-3 py-2 text-[0.92em] text-err"
      }
    >
      {children}
    </p>
  );
}

export function TextField({
  label,
  hint,
  error,
  htmlFor,
  input,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  input: InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-[0.92em] font-medium">
        {label}
      </label>
      <input
        id={htmlFor}
        className="auth-field"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined}
        {...input}
      />
      {hint && !error ? (
        <span id={`${htmlFor}-hint`} className="text-[0.82em] text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${htmlFor}-error`} className="text-[0.82em] text-err">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Honeypot + signed render time. Both are invisible to real people. */
export function FormGuards({ formToken }: { formToken: string }) {
  return (
    <>
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website-field">Website</label>
        <input id="website-field" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="formToken" value={formToken} />
    </>
  );
}

export function SubmitButton({
  pending,
  children,
  onClick,
  type = "submit",
}: {
  pending: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending}
      className="auth-button w-full disabled:opacity-60"
    >
      {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
