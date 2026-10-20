"use client";

import { useState } from "react";
import { Calendar, type DayMark } from "@/components/ui/Calendar";

/**
 * Read-only month view for the worker home side column. Month navigation is
 * local state; the parent supplies the marks and the starting month.
 */
export function MiniMonth({
  year: initialYear,
  month: initialMonth,
  marks,
}: {
  year: number;
  month: number;
  marks: Record<string, DayMark>;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  return (
    <Calendar
      mode="readonly"
      year={year}
      month={month}
      marks={marks}
      onMonthChange={(delta) => {
        const next = month + delta;
        if (next < 1) {
          setMonth(12);
          setYear(year - 1);
        } else if (next > 12) {
          setMonth(1);
          setYear(year + 1);
        } else {
          setMonth(next);
        }
      }}
    />
  );
}
