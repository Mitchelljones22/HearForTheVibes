// Helpers for the YYYY-MM-DD date strings used in subscription data.
// `new Date('2026-11-28')` is parsed as UTC midnight, which shows as the
// previous day in US time zones, so these parse the parts as a local date.

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

const longFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "Nov 28, 2026" */
export function formatDate(iso: string): string {
  return longFormat.format(parseIsoDate(iso));
}

/** "Nov 28" */
export function formatShortDate(iso: string): string {
  return shortFormat.format(parseIsoDate(iso));
}

/** Whole days from today until the date (0 = today, negative = past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseIsoDate(iso).getTime() - today.getTime()) / 86_400_000);
}
