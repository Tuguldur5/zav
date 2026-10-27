"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Flat sticky bar at the bottom of a multi-select list (never a dock). */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="st-bulkbar" role="region" aria-label="Олон сонголт">
      <span className="shrink-0 text-[13px] font-semibold">Сонгосон: {count}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
        {children}
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label="Сонголтыг цэвэрлэх"
        title="Сонголтыг цэвэрлэх"
        className="press grid size-9 shrink-0 place-items-center rounded-full bg-tint-1"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
