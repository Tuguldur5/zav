"use client";

import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Calendar, type DayMark } from "@/components/ui/Calendar";
import { DaySheet } from "@/components/ui/DaySheet";
import { Snackbar } from "@/components/ui/Snackbar";
import { shiftMonth, todayISO } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import { bulkAvailabilityAction, setAvailabilityAction } from "@/app/worker/(app)/actions";

export function WorkerCalendar({ initialMarks }: { initialMarks: Record<string, DayMark> }) {
  const [marks, setMarks] = useState(initialMarks);
  const [today] = useState(todayISO);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [multi, setMulti] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function changeMonth(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelected([]);
  }

  function toggleSelect(day: string) {
    const mark = marks[day];
    if (mark?.status === "booked" || mark?.status === "confirmed") {
      setSnack({ message: "Энэ өдрийг өөрчлөх боломжгүй", tone: "error" });
      return;
    }
    setSelected((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
    );
  }

  async function pick(slot: "full" | "am" | "pm" | null) {
    if (!sheetDay) return;
    const day = sheetDay;
    const previous = marks[day];
    if (previous?.status === "booked") {
      setSnack({ message: "Энэ өдөр ажилтай тул арилгах боломжгүй", tone: "error" });
      return;
    }
    if (previous?.status === "confirmed") {
      setSnack({ message: "Админ баталгаажуулсан өдрийг өөрчлөх боломжгүй", tone: "error" });
      return;
    }

    const next = { ...marks };
    if (slot === null) delete next[day];
    else next[day] = { slot, status: "open", createdByStaff: false };
    setMarks(next);
    setSheetDay(null);
    setBusy(true);
    const result = await setAvailabilityAction(day, slot);
    setBusy(false);
    if (!result.ok) {
      setMarks(marks);
      setSnack({ message: result.error ?? "Хадгалах боломжгүй", tone: "error" });
      return;
    }
    setSnack({ message: "Хадгаллаа", tone: "success" });
  }

  async function saveSelected() {
    if (selected.length === 0) return;
    const valid = selected.filter((day) => {
      const mark = marks[day];
      return day >= today && mark?.status !== "booked" && mark?.status !== "confirmed";
    });
    if (valid.length === 0) {
      setSnack({ message: "Сонгосон өдрүүдийг өөрчлөх боломжгүй", tone: "error" });
      return;
    }

    const previous = marks;
    const next = { ...marks };
    for (const day of valid) next[day] = { slot: "full", status: "open" };
    setMarks(next);
    setBusy(true);
    const result = await bulkAvailabilityAction(valid);
    setBusy(false);
    if (!result.ok) {
      setMarks(previous);
      setSnack({ message: result.error ?? "Хадгалах боломжгүй", tone: "error" });
      return;
    }
    setSelected([]);
    setMulti(false);
    setSnack({ message: `${result.count ?? valid.length} өдөр хадгаллаа`, tone: "success" });
  }

  const sheetDayMark = sheetDay ? marks[sheetDay] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant={multi ? "filled" : "outline"}
          onClick={() => {
            setMulti((value) => !value);
            setSelected([]);
          }}
        >
          {multi ? "Олон сонголт идэвхтэй" : "Олон өдөр сонгох"}
        </Button>
        <p className="flex items-center gap-1 text-[0.9em] text-muted">
          <CalendarDays aria-hidden className="size-4" />
          {multi ? `${selected.length} өдөр сонгосон` : "Өдрөө дарж тэмдэглэнэ"}
        </p>
      </div>

      {multi && selected.length > 0 ? (
        <Button
          onClick={saveSelected}
          loading={busy}
          icon={<Check aria-hidden className="size-5" />}
          full
        >
          Сонгосон {selected.length} өдрийг чөлөөтэй болгох
        </Button>
      ) : null}

      <Calendar
        mode="worker"
        year={year}
        month={month}
        marks={marks}
        onMonthChange={changeMonth}
        onDayClick={(day) => setSheetDay(day)}
        selected={selected}
        onToggleSelect={toggleSelect}
        multi={multi}
      />

      <p className="rounded-md bg-container px-3 py-2 text-[0.9em]">
        Тэмдэглэсэн өдрөө админ баталгаажуулсны дараа ажлын санал ирнэ. Ажилтай өдрийг арилгах
        боломжгүй.
      </p>

      <DaySheet
        open={Boolean(sheetDay)}
        day={sheetDay}
        mark={sheetDayMark}
        onClose={() => setSheetDay(null)}
        onPick={pick}
        busy={busy}
      />

      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />

      {sheetDayMark && !multi ? (
        <p className="text-center text-[0.8em] text-muted">
          Одоогийн төлөв: {slotLabels[sheetDayMark.slot]}
        </p>
      ) : null}
    </div>
  );
}
