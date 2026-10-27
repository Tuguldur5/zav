"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function NativeDialog({
  openLabel,
  title,
  closeLabel,
}: {
  openLabel: string;
  title: string;
  closeLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="ds-dialog-demo">
      <button
        type="button"
        className="ds-button ds-button--primary"
        onClick={() => dialogRef.current?.showModal()}
      >
        <span>{openLabel}</span>
        <ArrowRight aria-hidden className="ds-button-arrow" />
      </button>
      <dialog ref={dialogRef} className="ds-dialog">
        <h2>{title}</h2>
        <form method="dialog">
          <button className="ds-button ds-button--secondary" type="submit">
            {closeLabel}
          </button>
        </form>
      </dialog>
    </div>
  );
}
