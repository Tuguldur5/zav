"use client";

import { useState } from "react";
import { Calendar, type DayMark } from "@/components/ui/Calendar";
import { shiftMonth, todayISO } from "@/lib/dates";

export function MonthCalendar({
  marks,
  mode = "readonly",
}: {
  marks: Record<string, DayMark>;
  mode?: "readonly" | "worker";
}) {
  const today = todayISO();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));

  return (
    <Calendar
      mode={mode}
      year={year}
      month={month}
      marks={marks}
      onMonthChange={(delta) => {
        const next = shiftMonth(year, month, delta);
        setYear(next.year);
        setMonth(next.month);
      }}
    />
  );
}
