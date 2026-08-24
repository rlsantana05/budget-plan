/**
 * Week derivation for the Budget weekly ledger (spec
 * 2026-08-23-budget-weekly-ledger). Weeks run Saturday → Friday: the family
 * reviews on Friday, covering the week that ends that day.
 *
 * A calendar month yields 4–5 weeks. Edge weeks clip to the month boundary,
 * so a week's dates may start in the prior month or end in the next.
 */

export interface Week {
  /** ISO date (YYYY-MM-DD) of the week's Saturday — stable identity/key. */
  key: string;
  start: Date;
  end: Date;
  year: number;
  /** Calendar month number (1–12) this week belongs to. */
  month: number;
  tag: 'past' | 'current' | 'future';
}

/** YYYY-MM-DD for a Date, in local time. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The most recent Saturday on or before `d`. */
function saturdayOnOrBefore(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // getDay(): 0 Sun … 6 Sat. Days since Saturday:
  const daysSinceSat = (out.getDay() + 1) % 7;
  out.setDate(out.getDate() - daysSinceSat);
  return out;
}

/**
 * All review weeks overlapping [year, month] (1-based), clipped to that
 * month's first/last day. Ordered chronologically.
 */
export function getMonthWeeks(year: number, month: number): Week[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0); // day 0 of next month = last of this

  const weeks: Week[] = [];
  // First week may begin in the prior month: back up to its Saturday.
  const cursor = saturdayOnOrBefore(first);

  while (cursor <= last) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6); // Friday

    weeks.push({
      key: toIsoDate(cursor),
      start: new Date(cursor),
      end,
      year,
      month,
      tag: 'future', // caller overrides via withTags
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

/** Stamp each week past/current/future relative to today. */
export function withTags(weeks: Week[], now: Date = new Date()): Week[] {
  const today = toIsoDate(now);
  return weeks.map((w) => ({
    ...w,
    tag: toIsoDate(w.end) < today ? 'past'
      : toIsoDate(w.start) <= today && today <= toIsoDate(w.end) ? 'current'
      : 'future',
  }));
}

/** "Apr 11 – Apr 17" style label; includes the month name when ranges cross. */
export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const optsDay = { day: 'numeric' as const };
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('en-US', o);

  if (sameMonth) {
    return `${fmt(start, { month: 'short' })} ${fmt(start, optsDay)} – ${fmt(end, optsDay)}`;
  }
  return `${fmt(start, { month: 'short' })} ${fmt(start, optsDay)} – ${fmt(end, { month: 'short' })} ${fmt(end, optsDay)}`;
}

/** Tag label shown in the rail. */
export function tagLabel(tag: Week['tag']): string {
  return tag === 'current' ? 'Current' : tag === 'past' ? 'Past' : 'Future';
}
