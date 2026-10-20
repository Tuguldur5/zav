"use client";

import { useState } from "react";
import { Calendar, type CalendarWorker, type DayMark } from "@/components/ui/Calendar";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Snackbar } from "@/components/ui/Snackbar";
import { Card } from "@/components/ui/Card";
import { formatDateMn, startOfWeekISO, todayISO } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import { confirmAvailabilityAction, setWorkerAvailabilityAction } from "@/lib/actions/admin";

const slotOptions: Array<{ value: "full" | "am" | "pm"; label: string }> = [
  { value: "full", label: "Өдөржин чөлөөтэй" },
  { value: "am", label: "Өглөө чөлөөтэй" },
  { value: "pm", label: "Үдээс хойш чөлөөтэй" },
];

export function AdminCalendar({
  workers,
}: {
  workers: Array<{ id: string; name: string; days: Record<string, DayMark> }>;
}) {
  const [weekStart, setWeekStart] = useState(startOfWeekISO(todayISO()));
  const [selection, setSelection] = useState<{ workerId: string; day: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [localWorkers, setLocalWorkers] = useState<CalendarWorker[]>(workers);

  const selectedWorker = selection
    ? (localWorkers.find((worker) => worker.id === selection.workerId) ?? null)
    : null;
  const selectedMark = selection ? selectedWorker?.days[selection.day] : undefined;

  async function apply(slot: "full" | "am" | "pm" | null) {
    if (!selection) return;
    const { workerId, day } = selection;
    setBusy(true);

    if (slot === null) {
      const result = await setWorkerAvailabilityAction(workerId, day, null);
      setBusy(false);
      setSelection(null);
      setSnack({
        message: result.ok ? "Арилгалаа" : (result.error ?? "Алдаа гарлаа"),
        tone: result.ok ? "success" : "error",
      });
    } else {
      const result = await setWorkerAvailabilityAction(workerId, day, slot);
      setBusy(false);
      if (!result.ok) {
        setSnack({ message: result.error ?? "Алдаа гарлаа", tone: "error" });
        return;
      }
      const confirmed = await confirmAvailabilityAction(workerId, day, false);
      setSnack({
        message: confirmed.ok ? "Хадгаллаа" : "Хадгаллаа, баталгаажуулах дутлаа",
        tone: confirmed.ok ? "success" : "success",
      });
      setLocalWorkers((current) =>
        current.map((worker) =>
          worker.id === workerId
            ? {
                ...worker,
                days: {
                  ...worker.days,
                  [day]: {
                    slot,
                    status: confirmed.ok ? "confirmed" : "open",
                    createdByStaff: true,
                  },
                },
              }
            : worker,
        ),
      );
      setSelection(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        mode="admin"
        weekStart={weekStart}
        workers={localWorkers}
        onWeekChange={(delta) =>
          setWeekStart(
            startOfWeekISO(
              new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + delta * 7 * 86400000)
                .toISOString()
                .slice(0, 10),
            ),
          )
        }
        onCellClick={(workerId, day) => setSelection({ workerId, day })}
      />

      <Sheet
        open={Boolean(selection)}
        onClose={() => setSelection(null)}
        title={
          selection && selectedWorker
            ? `${selectedWorker.name} · ${formatDateMn(selection.day)}`
            : ""
        }
      >
        <p className="mb-3 text-[0.9em] text-muted">
          Өдрийн төлөвийг өөрчлөхөд ажилтанд мэдэгдэж, календарьд шууд тусна. Ажилтай өдрийг өөрчлөх
          боломжгүй.
        </p>

        {selectedMark ? (
          <div className="mb-3 rounded-md bg-container px-3 py-2 text-[0.9em]">
            Одоогийн байдал: {slotLabels[selectedMark.slot]} ·{" "}
            {selectedMark.status === "confirmed"
              ? "Баталгаажсан"
              : selectedMark.status === "booked"
                ? "Ажилтай"
                : "Чөлөөтэй"}
          </div>
        ) : (
          <div className="mb-3 rounded-md bg-container px-3 py-2 text-[0.9em]">
            Одоогоор тэмдэглээгүй
          </div>
        )}

        <div className="flex flex-col gap-2 pb-2">
          {slotOptions.map((option) => (
            <Button
              key={option.value}
              full
              variant="tonal"
              loading={busy}
              onClick={() => apply(option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button full variant="outline" onClick={() => setSelection(null)}>
            Болих
          </Button>
        </div>
      </Sheet>
      {localWorkers.length === 0 ? (
        <Card className="text-[0.9em] text-muted">
          Танд одоогоор хуваарилагдсан ажилтан байхгүй. Супер админ хуваарилснаар харагдана.
        </Card>
      ) : null}
      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />
    </div>
  );
}
