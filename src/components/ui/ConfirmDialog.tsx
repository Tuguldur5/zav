"use client";

import { Dialog } from "./Dialog";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Та итгэлтэй байна уу?",
  message,
  confirmLabel = "Тийм",
  cancelLabel = "Үгүй",
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      {message ? <p className=" text-ink">{message}</p> : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" full onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          full
          loading={loading}
          onClick={onConfirm}
          className={destructive ? "bg-error text-white" : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
