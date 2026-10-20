"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Хаах"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-in relative z-10 w-full max-w-xl sheet-radius bg-surface elev-2"
      >
        <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
          <div
            aria-hidden
            className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-container"
          />
          <p className="pt-2 text-[1.05em] font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="press flex min-h-11 min-w-11 items-center justify-center rounded-md"
          >
            <X aria-hidden className="size-5" />
            <span className="sr-only">Хаах</span>
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-5 pb-3">{children}</div>
        {footer ? (
          <div className="border-t border-container px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
