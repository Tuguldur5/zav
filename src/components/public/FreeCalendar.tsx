"use client";

import { useState } from "react";
import { Briefcase, Check, ChevronLeft, ChevronRight, Circle, CircleDashed } from "lucide-react";
import { monthMatrix, monthTitle, shiftMonth, WEEKDAYS_MN } from "@/lib/dates";
import { setAvailabilityAction } from "@/app/worker/(app)/actions";
import { mn } from "@/lib/i18n/mn";
import { Note, buttonCls, cx } from "./ui";

export type Mark = {
  slot: "full" | "am" | "pm";
  status: "open" | "confirmed" | "booked";
  createdByStaff?: boolean;
};

const copy = mn.app.calendar;
const SLOT_LABEL = {
  full: copy.fullDay,
  am: copy.morning,
  pm: copy.afternoon,
} as const;

const OPTIONS = [
  { label: mn.app.fullDay, slot: "full" },
  { label: mn.app.morning, slot: "am" },
  { label: mn.app.afternoon, slot: "pm" },
  { label: mn.app.noFree, slot: null },
] as const;

function statusLabel(mark: Mark | undefined): string {
  if (mark?.status === "confirmed") return copy.confirmed;
  if (mark?.status === "booked") return copy.booked;
  if (mark?.status === "open") return copy.free;
  return copy.unmarked;
}

function dayClass(mark: Mark | undefined, past: boolean, selected: boolean): string {
  const state = mark?.status ?? "unmarked";
  return cx(
    "public-calendar-day",
    `public-calendar-day--${state}`,
    past && "public-calendar-day--past",
    selected && "is-selected",
  );
}

export function FreeCalendar({
  initialMarks,
  today,
}: {
  initialMarks: Record<string, Mark>;
  today: string;
}) {
  const [marks, setMarks] = useState(initialMarks);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "warn" | "err";
    text: string;
  } | null>(null);

  const weeks = monthMatrix(year, month);
  const activeMark = activeDay ? marks[activeDay] : undefined;

  function openDay(day: string) {
    if (day < today) {
      setMessage({ tone: "warn", text: copy.pastWarning });
      return;
    }
    const mark = marks[day];
    if (mark?.status === "booked") {
      setMessage({ tone: "warn", text: copy.bookedWarning });
      return;
    }
    if (mark?.status === "confirmed") {
      setMessage({ tone: "warn", text: copy.confirmedWarning });
      return;
    }
    setMessage(null);
    setActiveDay(day);
  }

  async function pick(slot: "full" | "am" | "pm" | null) {
    if (!activeDay || busy) return;
    const day = activeDay;
    const previous = marks;
    const next = { ...marks };
    if (slot === null) delete next[day];
    else next[day] = { slot, status: "open" };
    setMarks(next);
    setBusy(true);

    try {
      const result = await setAvailabilityAction(day, slot);
      if (!result.ok) {
        setMarks(previous);
        setMessage({ tone: "err", text: result.error ?? copy.saveFailed });
        return;
      }
      setActiveDay(null);
      setMessage({ tone: "ok", text: mn.common.saved });
    } catch (error) {
      setMarks(previous);
      setMessage({ tone: "err", text: copy.saveFailed });
      console.error("Could not save worker availability:", error);
    } finally {
      setBusy(false);
    }
  }

  function changeMonth(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setActiveDay(null);
  }

  const panel = (
    <>
      <h2 className="public-calendar-panel-title">
        {activeDay
          ? `${activeDay} · ${activeMark ? SLOT_LABEL[activeMark.slot] : copy.unmarked}`
          : copy.optionsTitle}
      </h2>
      {activeDay ? (
        <div className="public-calendar-options">
          {OPTIONS.map((option) => {
            const active =
              option.slot === null ? !activeMark : activeMark?.slot === option.slot;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => pick(option.slot)}
                disabled={busy}
                aria-pressed={active}
                className={cx(
                  "public-calendar-option",
                  active && "is-active",
                )}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={buttonCls("text")}
          >
            {mn.common.close}
          </button>
        </div>
      ) : (
        <p className="public-calendar-instructions">{copy.instructions}</p>
      )}
    </>
  );

  return (
    <div className="public-calendar">
      <div className="public-calendar-layout">
        <div className="public-calendar-main">
          <div className="public-calendar-month">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="public-calendar-month-button"
              aria-label={copy.previousMonth}
            >
              <ChevronLeft aria-hidden />
            </button>
            <p aria-live="polite">{monthTitle(year, month)}</p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="public-calendar-month-button"
              aria-label={copy.nextMonth}
            >
              <ChevronRight aria-hidden />
            </button>
          </div>

          <div className="public-calendar-grid" role="group" aria-label={mn.app.freeDays}>
            {WEEKDAYS_MN.map((label) => (
              <span className="public-calendar-weekday" key={label}>
                {label}
              </span>
            ))}
            {weeks.flat().map((cell) => {
              const mark = marks[cell.iso];
              const past = cell.iso < today;
              const selected = activeDay === cell.iso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => openDay(cell.iso)}
                  aria-label={`${cell.iso}, ${statusLabel(mark)}`}
                  aria-pressed={selected}
                  className={cx(
                    dayClass(mark, past, selected),
                    !cell.inMonth && "is-outside-month",
                    cell.iso === today && "is-today",
                  )}
                >
                  <span>{cell.day}</span>
                  {mark?.status === "confirmed" ? (
                    <span className="public-calendar-day-check-badge">
                      <Check aria-hidden />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <ul className="public-calendar-legend" aria-label={copy.dayStatus}>
            <li><Circle aria-hidden /><span>{copy.free}</span></li>
            <li><Check aria-hidden /><span>{copy.confirmed}</span></li>
            <li><Briefcase aria-hidden /><span>{copy.booked}</span></li>
            <li><CircleDashed aria-hidden /><span>{copy.unmarked}</span></li>
          </ul>
        </div>

        <aside className="public-calendar-side" aria-label={copy.optionsTitle}>
          {panel}
        </aside>
      </div>

      {activeDay ? (
        <aside
          className="public-calendar-sheet"
          aria-label={copy.optionsTitle}
          aria-live="polite"
        >
          {panel}
        </aside>
      ) : null}

      {message ? (
        <Note tone={message.tone}>
          {message.text}
        </Note>
      ) : null}
    </div>
  );
}
