"use client";

import { useState } from "react";
import { Check, Copy, MessageSquare, Phone } from "lucide-react";
import { buttonClass, cx } from "./styles";

/**
 * The three things an admin does with a phone number. Big, plain targets —
 * `tel:`/`sms:` are handled by the device, copy falls back to a prompt-free
 * clipboard write with a short confirmation.
 */
export function PhoneActions({
  phone,
  className,
  compact = false,
}: {
  phone: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const digits = phone.replace(/[^\d+]/g, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      <a href={`tel:${digits}`} className={cx(buttonClass("tonal", false, compact ? "sm" : "md"))}>
        <Phone aria-hidden className="size-4" />
        Залгах
      </a>
      <a
        href={`sms:${digits}`}
        className={cx(buttonClass("outline", false, compact ? "sm" : "md"))}
      >
        <MessageSquare aria-hidden className="size-4" />
        Мессеж
      </a>
      <button
        type="button"
        onClick={copy}
        className={cx(buttonClass("outline", false, compact ? "sm" : "md"))}
      >
        {copied ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
        {copied ? "Хуулагдлаа" : "Хуулах"}
      </button>
    </div>
  );
}
