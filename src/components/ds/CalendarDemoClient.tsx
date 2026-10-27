"use client";

import { useState } from "react";

export function CalendarDemoClient({
  label,
  title,
  hint,
  freeLabel,
  emptyLabel,
}: {
  label: string;
  title: string;
  hint: string;
  freeLabel: string;
  emptyLabel: string;
}) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());

  function toggle(day: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <section className="calendar-demo" aria-label={label}>
      <div className="calendar-demo-head">
        <div>
          <p className="ds-label">{label}</p>
          <h2>{title}</h2>
        </div>
        <p>{hint}</p>
      </div>
      <div className="calendar-grid" role="group" aria-label={title}>
        {Array.from({ length: 30 }, (_, index) => {
          const day = index + 1;
          const free = selected.has(day);
          return (
            <button
              aria-pressed={free}
              aria-label={`${day} · ${free ? freeLabel : emptyLabel}`}
              className={free ? "calendar-day calendar-day--free" : "calendar-day"}
              key={day}
              onClick={() => toggle(day)}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="calendar-key calendar-key--free" aria-hidden />
          {freeLabel}
        </span>
        <span>
          <i className="calendar-key" aria-hidden />
          {emptyLabel}
        </span>
      </div>
    </section>
  );
}
