export const TZ = "Asia/Ulaanbaatar";
export const WEEKDAYS_MN = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"] as const;
export const WEEKDAYS_LONG_MN = [
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба",
  "Ням",
] as const;

/** Today's date in Ulaanbaatar as YYYY-MM-DD (fixed locale, no hydration drift). */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isPastISO(iso: string, today: string = todayISO()): boolean {
  return iso < today;
}

export function isoParts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toISO(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function utcDate(iso: string): Date {
  const { year, month, day } = isoParts(iso);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysISO(iso: string, days: number): string {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

/** Monday-first weekday index (0 = Monday). */
export function weekdayIndex(iso: string): number {
  return (utcDate(iso).getUTCDay() + 6) % 7;
}

export function startOfWeekISO(iso: string): string {
  return addDaysISO(iso, -weekdayIndex(iso));
}

export function monthTitle(year: number, month: number): string {
  return `${year} оны ${month}-р сар`;
}

export type MonthCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

/** Monday-first calendar matrix for a month. */
export function monthMatrix(year: number, month: number): MonthCell[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));

  const weeks: MonthCell[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const row: MonthCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const current = new Date(start);
      current.setUTCDate(start.getUTCDate() + week * 7 + day);
      const iso = toISO(current);
      row.push({
        iso,
        day: current.getUTCDate(),
        inMonth: current.getUTCMonth() === month - 1,
      });
    }
    weeks.push(row);
    if (week >= 3 && weeks[week].every((cell) => !cell.inMonth)) break;
  }
  return weeks;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

/** "2026 оны 10-р сарын 17, Баасан" style date label. */
export function formatDateMn(iso: string, withWeekday = true): string {
  const { year, month, day } = isoParts(iso);
  const weekday = WEEKDAYS_LONG_MN[weekdayIndex(iso)];
  return withWeekday
    ? `${year} оны ${month}-р сарын ${day}, ${weekday}`
    : `${year} оны ${month}-р сарын ${day}`;
}

export function formatShortDateMn(iso: string): string {
  const { month, day } = isoParts(iso);
  return `${month}-р сарын ${day}`;
}

export function formatDateTimeMn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("mn-MN", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatMoney(value: number | null): string {
  if (value === null) return "Тохиролцоно";
  return `${new Intl.NumberFormat("en-US").format(value)} ₮`;
}

export function daysInWeek(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysISO(weekStart, index));
}

export function relativeHourLabel(isoDateTime: string): string {
  const diff = Date.now() - new Date(isoDateTime).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Саяхан";
  if (hours < 24) return `${hours} цагийн өмнө`;
  return `${Math.floor(hours / 24)} өдрийн өмнө`;
}
