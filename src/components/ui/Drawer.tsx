"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
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
    <div className="fixed inset-0 z-50 flex">
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
        className="sheet-in relative z-10 flex h-full w-80 max-w-[85%] flex-col bg-surface elev-2"
      >
        <div className="flex items-center justify-between border-b border-container px-4 py-3">
          <p className=" font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="press flex min-h-11 min-w-11 items-center justify-center rounded-md"
          >
            <X aria-hidden className="size-5" />
            <span className="sr-only">Хаах</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );
}
