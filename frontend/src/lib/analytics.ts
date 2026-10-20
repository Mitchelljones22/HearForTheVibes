import type { Subscription, SubscriptionCategory } from '../types/subscription';
import { parseIsoDate } from './dates';
import { monthlyCost } from './subscriptionStats';

// Numbers for the Analytics page, calculated from the subscription list.
// Everything here is forward-looking: it uses each subscription's next renewal
// date and billing cycle, because the app doesn't store past payments.

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Adds months, keeping the original day where possible (Jan 31 -> Feb 28 -> Mar 31). */
function addMonths(base: Date, months: number): Date {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return target;
}

/** Every date an active subscription charges, from `from` (inclusive) to `to` (exclusive). */
export function chargeDates(sub: Subscription, from: Date, to: Date): Date[] {
  if (sub.status !== 'active') return [];
  const first = parseIsoDate(sub.nextRenewalDate);
  const step = sub.billingCycle === 'yearly' ? 12 : 1;
  const dates: Date[] = [];
  for (let i = 0; ; i++) {
    const date = addMonths(first, i * step);
    if (date >= to) break;
    if (date >= from) dates.push(date);
    if (i > 1000) break; // safety net for bad data
  }
  return dates;
}

export interface MonthBucket {
  /** First day of the month. */
  month: Date;
  total: number;
  charges: { serviceName: string; amount: number }[];
}

/** Expected charges for this month (from today) and the following 11 months. */
export function upcomingByMonth(subs: Subscription[], today = new Date(), months = 12): MonthBucket[] {
  const from = startOfDay(today);
  const firstMonth = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + months, 1);

  const buckets: MonthBucket[] = Array.from({ length: months }, (_, i) => ({
    month: new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1),
    total: 0,
    charges: [],
  }));

  for (const sub of subs) {
    for (const date of chargeDates(sub, from, end)) {
      const index = (date.getFullYear() - firstMonth.getFullYear()) * 12 + date.getMonth() - firstMonth.getMonth();
      buckets[index].total += sub.cost;
      buckets[index].charges.push({ serviceName: sub.serviceName, amount: sub.cost });
    }
  }
  for (const b of buckets) b.charges.sort((a, b2) => b2.amount - a.amount);
  return buckets;
}

/** Total and number of charges between today and `days` from now. */
export function dueWithin(subs: Subscription[], days: number, today = new Date()) {
  const from = startOfDay(today);
  const to = new Date(from);
  to.setDate(to.getDate() + days + 1);
  let total = 0;
  let count = 0;
  for (const sub of subs) {
    const dates = chargeDates(sub, from, to);
    total += dates.length * sub.cost;
    count += dates.length;
  }
  return { total, count };
}

/** The active subscription that costs the most per month (yearly plans divided by 12). */
export function biggestExpense(subs: Subscription[]): Subscription | null {
  return subs
    .filter((s) => s.status === 'active')
    .reduce<Subscription | null>((max, s) => (!max || monthlyCost(s) > monthlyCost(max) ? s : max), null);
}

/** What paused and cancelled subscriptions would cost per month if they were active. */
export function monthlySavings(subs: Subscription[]) {
  const inactive = subs.filter((s) => s.status !== 'active');
  return { total: inactive.reduce((sum, s) => sum + monthlyCost(s), 0), count: inactive.length };
}

export interface CategorySpend {
  category: SubscriptionCategory;
  monthly: number;
  /** 0-1 share of total monthly spend. */
  share: number;
  services: string[];
}

/** Monthly spend per category for active subscriptions, largest first. */
export function spendByCategory(subs: Subscription[]): CategorySpend[] {
  const active = subs.filter((s) => s.status === 'active');
  const total = active.reduce((sum, s) => sum + monthlyCost(s), 0);
  const map = new Map<SubscriptionCategory, CategorySpend>();
  for (const s of active) {
    const entry = map.get(s.category) ?? { category: s.category, monthly: 0, share: 0, services: [] };
    entry.monthly += monthlyCost(s);
    entry.services.push(s.serviceName);
    map.set(s.category, entry);
  }
  return [...map.values()]
    .map((c) => ({ ...c, share: total ? c.monthly / total : 0 }))
    .sort((a, b) => b.monthly - a.monthly);
}
