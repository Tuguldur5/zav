"use client";

import { AlertTriangle, Briefcase, Check, MoonStar, Sun, Trash2 } from "lucide-react";
import { formatDateMn } from "@/lib/dates";
import { Sheet } from "./Sheet";
import type { DayMark } from "./Calendar";
import { slotLabels } from "@/lib/status";

const options = [
  { slot: "full" as const, label: "Өдөржин чөлөөтэй", icon: Sun },
  { slot: "am" as const, label: "Өглөө чөлөөтэй", icon: Sun },
  { slot: "pm" as const, label: "Үдээс хойш чөлөөтэй", icon: MoonStar },
];

export function DaySheet({
  open,
  day,
  mark,
  onClose,
  onPick,
  busy = false,
}: {
  open: boolean;
  day: string | null;
  mark?: DayMark;
  onClose: () => void;
  onPick: (slot: "full" | "am" | "pm" | null) => void;
  busy?: boolean;
}) {
  if (!day) return null;
  const booked = mark?.status === "booked";

  return (
    <Sheet open={open} onClose={onClose} title={formatDateMn(day)}>
      {booked ? (
        <div className="mb-4 flex gap-2 rounded-md bg-warm px-3 py-3 text-[0.9em] font-medium text-warm-ink">
          <Briefcase aria-hidden className="size-5 shrink-0" />
          Энэ өдөр ажилтай тул арилгах боломжгүй, админтай холбогдоно уу.
        </div>
      ) : mark?.status === "confirmed" ? (
        <div className="mb-4 flex gap-2 rounded-md bg-success-container px-3 py-3 text-[0.9em] font-medium text-success">
          <Check aria-hidden className="size-5 shrink-0" />
          Админ баталгаажуулсан. Өөрчлөх бол админтай холбогдоно уу.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 pb-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = mark?.slot === option.slot && !booked;
          return (
            <button
              key={option.slot}
              type="button"
              disabled={busy || booked}
              onClick={() => onPick(option.slot)}
              className={
                active
                  ? "press flex min-h-16 items-center gap-3 rounded-md border-2 border-primary bg-primary-container px-4 text-left text-[1.05em] font-semibold text-on-primary-container disabled:opacity-50"
                  : "press flex min-h-16 items-center gap-3 rounded-md border border-outline bg-surface px-4 text-left text-[1.05em] font-semibold text-ink disabled:opacity-50"
              }
            >
              <Icon aria-hidden className="size-6 shrink-0" />
              <span className="flex-1">{option.label}</span>
              {active ? <Check aria-hidden className="size-5" /> : null}
            </button>
          );
        })}

        <button
          type="button"
          disabled={busy || booked || !mark}
          onClick={() => onPick(null)}
          className="press mt-2 flex min-h-16 items-center gap-3 rounded-md border-2 border-error bg-error-container px-4 text-left text-[1.05em] font-semibold text-error disabled:opacity-40"
        >
          <Trash2 aria-hidden className="size-6 shrink-0" />
          <span className="flex-1">Чөлөөгүй (арилгах)</span>
        </button>

        {mark ? (
          <p className="flex items-center gap-1 text-[0.8em] text-muted">
            {mark.createdByStaff ? <AlertTriangle aria-hidden className="size-3.5" /> : null}
            Одоогийн төлөв: {slotLabels[mark.slot]}
            {mark.createdByStaff ? " · Админ тэмдэглэсэн" : ""}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
