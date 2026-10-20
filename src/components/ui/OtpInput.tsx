"use client";

import { useRef, useState } from "react";
import { cx, inputClass } from "./styles";

export type OtpState = "idle" | "verifying" | "error" | "success" | "locked" | "expired";

export function OtpInput({
  length = 6,
  onComplete,
  state = "idle",
  disabled = false,
}: {
  length?: number;
  onComplete: (code: string) => void;
  state?: OtpState;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function submitIfComplete(next: string[]) {
    const code = next.join("");
    if (code.length === length && next.every(Boolean)) onComplete(code);
  }

  function setAt(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
    submitIfComplete(next);
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    const next = Array(length).fill("");
    text.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    refs.current[Math.min(text.length, length - 1)]?.focus();
    submitIfComplete(next);
  }

  const isError = state === "error";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cx("flex justify-between gap-1.5 sm:gap-2", isError && "shake")}
        onPaste={onPaste}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setAt(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled || state === "verifying" || state === "locked"}
            aria-label={`Кодны ${index + 1}-р орон`}
            aria-invalid={isError || undefined}
            className={cx(
              inputClass,
              "w-full min-w-0 px-0 text-center text-[1.2em] font-semibold",
              isError && "border-error text-error",
              state === "success" && "border-success text-success",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 text-[0.9em]">
        {state === "verifying" ? <span className="text-muted">Шалгаж байна…</span> : null}
        {state === "error" ? (
          <span className="text-error">Код буруу байна. Дахин оруулна уу.</span>
        ) : null}
        {state === "success" ? <span className="text-success">Код зөв байна.</span> : null}
        {state === "locked" ? (
          <span className="text-error">Хэт олон оролдлого. Админтай холбогдоно уу.</span>
        ) : null}
        {state === "expired" ? (
          <span className="text-warm-ink">Хугацаа дууссан. Шинэ код аваарай.</span>
        ) : null}
      </p>
    </div>
  );
}
