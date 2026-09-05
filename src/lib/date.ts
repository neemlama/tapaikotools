/**
 * Parses a date-only "YYYY-MM-DD" string (from an <input type="date">) as
 * a *local* date. `new Date("YYYY-MM-DD")` parses as UTC midnight, which
 * silently shifts by a day in most timezones once compared against a
 * local `new Date()` — this avoids that.
 */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearStr, monthStr, dayStr] = match;
  const y = Number(yearStr);
  const m = Number(monthStr);
  const d = Number(dayStr);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  // Reject roll-over like 2024-02-31 -> 2024-03-02
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

/** birthDate advanced by `months` calendar months, with the day-of-month clamped to whatever that target month actually has (Jan 31 + 1 month -> Feb 28/29, never rolls into March). */
function addMonthsClamped(date: Date, months: number): Date {
  // Normalize via Date to handle year overflow (e.g. +14 months)
  const base = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInTargetMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(date.getDate(), daysInTargetMonth));
}

/**
 * Calendar-aware age. An earlier version walked year/month/day fields
 * directly with a "borrow a month" step when the day underflowed — that
 * breaks whenever the birth day-of-month exceeds the length of the
 * borrowed month (e.g. Jan 31 -> Mar 1 produced "1 month, -1 days").
 * Reproduced and confirmed with a direct test before rewriting.
 *
 * This version instead finds the most recent whole-month "anniversary" of
 * the birth date (clamped into whatever month it lands in) that doesn't
 * exceed `onDate`, then measures the remaining days as a plain date
 * subtraction — which is always exact, no field-arithmetic edge cases.
 */
export function calculateAge(birthDate: Date, onDate: Date = new Date()): AgeBreakdown {
  let totalMonths =
    (onDate.getFullYear() - birthDate.getFullYear()) * 12 + (onDate.getMonth() - birthDate.getMonth());

  let anniversary = addMonthsClamped(birthDate, totalMonths);
  if (anniversary.getTime() > onDate.getTime()) {
    totalMonths -= 1;
    anniversary = addMonthsClamped(birthDate, totalMonths);
  }

  // Use UTC midnight to avoid 23h/25h DST days drifting by 1
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.floor((utc(onDate) - utc(anniversary)) / 86_400_000);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const totalDays = Math.floor((utc(onDate) - utc(birthDate)) / 86_400_000);

  return { years, months, days, totalDays };
}

/**
 * Next occurrence of birthDate's month/day on or after `onDate` — this
 * year's anniversary if it hasn't passed yet, otherwise next year's.
 * Clamped the same way as addMonthsClamped (a Feb 29 birthday lands on
 * Feb 28 in a non-leap year).
 */
export function getNextBirthday(birthDate: Date, onDate: Date = new Date()): Date {
  const thisYear = onDate.getFullYear();
  const daysInMonthThisYear = new Date(thisYear, birthDate.getMonth() + 1, 0).getDate();
  const thisYearBirthday = new Date(
    thisYear,
    birthDate.getMonth(),
    Math.min(birthDate.getDate(), daysInMonthThisYear),
  );
  if (thisYearBirthday.getTime() >= onDate.getTime()) return thisYearBirthday;

  const nextYear = thisYear + 1;
  const daysInMonthNextYear = new Date(nextYear, birthDate.getMonth() + 1, 0).getDate();
  return new Date(nextYear, birthDate.getMonth(), Math.min(birthDate.getDate(), daysInMonthNextYear));
}
