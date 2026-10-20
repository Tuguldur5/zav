"use client";

import { useEffect } from "react";

export function Snackbar({
  message,
  open,
  onClose,
  tone = "success",
}: {
  message: string;
  open: boolean;
  onClose: () => void;
  tone?: "success" | "error";
}) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className={
        tone === "success"
          ? "fixed bottom-[calc(var(--row-h)+env(safe-area-inset-bottom)+12px)] left-1/2 z-50 w-[min(92%,28rem)] -translate-x-1/2 rounded-md bg-ink px-4 py-3 text-center text-[0.9em] font-medium text-white elev-2 lg:bottom-8"
          : "fixed bottom-[calc(var(--row-h)+env(safe-area-inset-bottom)+12px)] left-1/2 z-50 w-[min(92%,28rem)] -translate-x-1/2 rounded-md bg-error px-4 py-3 text-center text-[0.9em] font-medium text-white elev-2 lg:bottom-8"
      }
    >
      {message}
    </div>
  );
}
