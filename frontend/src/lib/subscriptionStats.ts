import type { Subscription } from '../types/subscription';

// Dashboard numbers are calculated from the subscription list on the frontend,
// so the backend only needs to provide the list itself.

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

/** What one subscription costs per month (yearly plans are divided by 12). */
export function monthlyCost(sub: Subscription): number {
  return sub.billingCycle === 'yearly' ? sub.cost / 12 : sub.cost;
}

export interface SubscriptionStats {
  monthlySpend: number;
  yearlySpend: number;
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  /** Soonest upcoming renewal among active subscriptions, if any. */
  nextRenewal: Subscription | null;
}

export function computeStats(subs: Subscription[]): SubscriptionStats {
  const active = subs.filter((s) => s.status === 'active');
  const monthlySpend = active.reduce((sum, s) => sum + monthlyCost(s), 0);

  // ISO dates (YYYY-MM-DD) sort correctly as plain strings.
  const nextRenewal = [...active]
    .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate))[0] ?? null;

  return {
    monthlySpend,
    yearlySpend: monthlySpend * 12,
    activeCount: active.length,
    pausedCount: subs.filter((s) => s.status === 'paused').length,
    cancelledCount: subs.filter((s) => s.status === 'cancelled').length,
    nextRenewal,
  };
}
