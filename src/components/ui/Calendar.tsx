"use client";

import { useState } from "react";
import { Briefcase, Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import {
  daysInWeek,
  formatDateMn,
  formatShortDateMn,
  isPastISO,
  monthMatrix,
  monthTitle,
  todayISO,
  WEEKDAYS_MN,
} from "@/lib/dates";
import { cx } from "./styles";

export type DayMark = {
  slot: "full" | "am" | "pm";
  status: "open" | "confirmed" | "booked";
  createdByStaff?: boolean;
};

export type CalendarWorker = {
  id: string;
  name: string;
  days: Record<string, DayMark>;
};

type WorkerModeProps = {
  mode: "worker" | "readonly";
  year: number;
  month: number;
  marks: Record<string, DayMark>;
  onMonthChange?: (delta: number) => void;
  onDayClick?: (iso: string) => void;
  selected?: string[];
  onToggleSelect?: (iso: string) => void;
  multi?: boolean;
};

type AdminModeProps = {
  mode: "admin";
  weekStart: string;
  workers: CalendarWorker[];
  onWeekChange?: (delta: number) => void;
  onCellClick?: (workerId: string, iso: string) => void;
};

function markCellClass(mark: DayMark | undefined, extra?: string): string {
  return cx(
    "relative flex min-h-[var(--control-h)] flex-col items-center justify-center rounded-md border text-[0.9em] font-semibold",
    !mark && "border-dashed border-outline bg-surface text-muted",
    mark?.status === "open" && "border-primary bg-primary-container text-on-primary-container",
    mark?.status === "confirmed" && "border-success bg-success-container text-success",
    mark?.status === "booked" && "border-warm-ink bg-warm text-warm-ink",
    extra,
  );
}

function MarkIcon({ mark }: { mark: DayMark | undefined }) {
  if (mark?.status === "confirmed") return <Check aria-hidden className="size-3.5" />;
  if (mark?.status === "booked") return <Briefcase aria-hidden className="size-3.5" />;
  if (mark?.status === "open") return <Circle aria-hidden className="size-3.5" />;
  return null;
}

function markLabel(mark: DayMark | undefined): string {
  if (!mark) return "Тэмдэглээгүй";
  if (mark.status === "confirmed") return "Админ баталгаажуулсан";
  if (mark.status === "booked") return "Ажилтай";
  return "Чөлөөтэй";
}

export function Calendar(props: WorkerModeProps | AdminModeProps) {
  if (props.mode === "admin") return <AdminWeek {...props} />;
  return <WorkerMonth {...props} />;
}

function WorkerMonth({
  mode,
  year,
  month,
  marks,
  onMonthChange,
  onDayClick,
  selected = [],
  onToggleSelect,
  multi = false,
}: WorkerModeProps) {
  const today = todayISO();
  const weeks = monthMatrix(year, month);
  const interactive = mode === "worker";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange?.(-1)}
          className="press flex min-h-[var(--control-h)] items-center gap-1 rounded-md border border-outline bg-surface px-3 text-[0.9em] font-semibold"
        >
          <ChevronLeft aria-hidden className="size-5" />
          Өмнөх
        </button>
        <p className="text-center font-semibold">{monthTitle(year, month)}</p>
        <button
          type="button"
          onClick={() => onMonthChange?.(1)}
          className="press flex min-h-[var(--control-h)] items-center gap-1 rounded-md border border-outline bg-surface px-3 text-[0.9em] font-semibold"
        >
          Дараах
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.8em] font-semibold text-muted">
        {WEEKDAYS_MN.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell) => {
          const mark = marks[cell.iso];
          const past = isPastISO(cell.iso, today);
          const picked = selected.includes(cell.iso);
          const disabled = !interactive || !cell.inMonth || past;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              aria-pressed={multi ? picked : undefined}
              aria-label={`${formatDateMn(cell.iso)}, ${markLabel(mark)}${past ? ", өнгөрсөн" : ""}`}
              onClick={() => {
                if (!cell.inMonth) return;
                if (multi) onToggleSelect?.(cell.iso);
                else onDayClick?.(cell.iso);
              }}
              className={markCellClass(
                cell.inMonth ? mark : undefined,
                cx(
                  "min-h-[var(--control-h)]",
                  !cell.inMonth && "invisible",
                  past && "opacity-40",
                  cell.iso === today && "ring-2 ring-primary ring-offset-1 ring-offset-bg",
                  picked && "ring-2 ring-ink ring-offset-1",
                  !disabled && "press",
                ),
              )}
            >
              <span>{cell.day}</span>
              <MarkIcon mark={cell.inMonth ? mark : undefined} />
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function AdminWeek({ weekStart, workers, onWeekChange, onCellClick }: AdminModeProps) {
  const today = todayISO();
  const days = daysInWeek(weekStart);
  const [selectedDay, setSelectedDay] = useState<string>(days[0]);
  const activeDay = days.includes(selectedDay) ? selectedDay : days[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onWeekChange?.(-1)}
          className="press flex min-h-11 items-center gap-1 rounded-md border border-outline bg-surface px-3 text-[0.9em] font-semibold"
        >
          <ChevronLeft aria-hidden className="size-5" />
          Өмнөх
        </button>
        <p className="text-center text-[0.9em] font-semibold">
          {formatShortDateMn(days[0])} – {formatShortDateMn(days[6])}
        </p>
        <button
          type="button"
          onClick={() => onWeekChange?.(1)}
          className="press flex min-h-11 items-center gap-1 rounded-md border border-outline bg-surface px-3 text-[0.9em] font-semibold"
        >
          Дараах
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-container bg-surface md:block">
        <table className="w-full border-collapse text-[0.9em]">
          <caption className="sr-only">Долоо хоногийн чөлөөт өдрүүд</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 bg-container px-3 py-2 text-left">
                Ажилтан
              </th>
              {days.map((day, index) => (
                <th
                  key={day}
                  scope="col"
                  className="bg-container px-1 py-2 text-center text-[0.8em]"
                >
                  <span className="block font-semibold">{WEEKDAYS_MN[index]}</span>
                  <span className={cx("block", day === today && "font-semibold text-primary")}>
                    {Number(day.slice(8))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker.id} className="border-t border-container">
                <th
                  scope="row"
                  className="sticky left-0 max-w-40 truncate bg-surface px-3 py-2 text-left font-medium"
                >
                  {worker.name}
                </th>
                {days.map((day) => {
                  const mark = worker.days[day];
                  const past = isPastISO(day, today);
                  return (
                    <td key={day} className="p-1 text-center">
                      <button
                        type="button"
                        disabled={past}
                        onClick={() => onCellClick?.(worker.id, day)}
                        title={mark?.createdByStaff ? "Админ тэмдэглэсэн" : undefined}
                        aria-label={`${worker.name}, ${formatDateMn(day)}, ${markLabel(mark)}`}
                        className={markCellClass(mark, cx("w-full", past && "opacity-40"))}
                      >
                        <MarkIcon mark={mark} />
                        {mark ? (
                          <span className="text-[10px] font-medium">
                            {mark.slot === "full"
                              ? "Өдөржин"
                              : mark.slot === "am"
                                ? "Өглөө"
                                : "Үдээс хойш"}
                          </span>
                        ) : null}
                        {mark?.createdByStaff ? (
                          <span className="sr-only">Админ тэмдэглэсэн</span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-pressed={activeDay === day}
              className={cx(
                "press flex min-h-[var(--control-h)] min-w-12 flex-col items-center justify-center rounded-md border-2 px-2 text-[0.8em] font-semibold",
                activeDay === day
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline bg-surface text-ink",
              )}
            >
              <span>{WEEKDAYS_MN[index]}</span>
              <span>{Number(day.slice(8))}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.9em] font-semibold">{formatDateMn(activeDay)}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {workers.map((worker) => {
            const mark = worker.days[activeDay];
            return (
              <li key={worker.id}>
                <button
                  type="button"
                  disabled={isPastISO(activeDay, today)}
                  onClick={() => onCellClick?.(worker.id, activeDay)}
                  className={markCellClass(mark, "w-full flex-row justify-between px-3")}
                >
                  <span>{worker.name}</span>
                  <span className="flex items-center gap-1 text-[0.8em]">
                    <MarkIcon mark={mark} />
                    {markLabel(mark)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Legend />
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-[0.8em]">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-1 text-on-primary-container">
        <Circle aria-hidden className="size-3" /> Чөлөөтэй
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-1 text-success">
        <Check aria-hidden className="size-3" /> Админ баталгаажуулсан
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-warm px-2 py-1 text-warm-ink">
        <Briefcase aria-hidden className="size-3" /> Ажилтай
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-outline px-2 py-1 text-muted">
        Тэмдэглээгүй
      </span>
    </div>
  );
}
